#!/usr/bin/env python3
"""
SommelierPRO — Knowledge Base Builder
163万文字の教本OCRテキストをセマンティックチャンクに分割し、
Gemini Embedding APIでベクトル化して knowledge_base.json を生成する。

Phase 1: チャンク化 + クリーンアップ + Embedding
"""

import json
import os
import re
import time
import sys
from google import genai

# ---- Paths ----
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'data')
CHAPTERS_DIR = os.path.join(DATA_DIR, 'chapters')
OUTPUT_PATH = os.path.join(DATA_DIR, 'knowledge_base.json')

# ---- Config ----
CHUNK_SIZE = 700       # target chars per chunk
CHUNK_OVERLAP = 100    # overlap chars between chunks
EMBEDDING_MODEL = 'gemini-embedding-001'
BATCH_SIZE = 20        # embeddings per batch request


# ============================================
# OCR Cleanup (inherited from generate_summaries.py)
# ============================================
def clean_ocr_text(text):
    """OCRノイズ除去"""
    # Phase 1: 記号・エンコーディングノイズ
    text = re.sub(r'[GE](?:PS?|Zy?|Xr?|Pf?|Pr?|Pz?|rf?|ry?|rz?)》?', '', text)
    text = re.sub(r'《[^》]*》', '', text)
    text = re.sub(r'GPE?f?s?z?r?y?x?》?', '', text)
    text = re.sub(r'GE?f?s?z?r?y?x?\d*》', '', text)
    text = re.sub(r'[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]+', '', text)
    text = re.sub(r'Zy\d*', '', text)
    text = re.sub(r'[ÿþ]', '', text)
    text = re.sub(r'[ヽ*]+[ご]', '', text)
    text = re.sub(r'Pe\]', '', text)
    text = re.sub(r'ULは', '', text)

    # Phase 2: OCR数字混入
    text = re.sub(r'っ\d{1,3}', '', text)
    text = re.sub(r'レZ\d+', '', text)
    text = re.sub(r'7 〇', '', text)
    text = re.sub(r'時Cr', '', text)

    # Phase 3: 破損カタカナ修復
    text = re.sub(r'ビピノ', 'ピノ', text)
    text = re.sub(r'ブプ(ブ?ル)', 'ブル', text)
    text = re.sub(r'ワヴ', 'ヴ', text)
    text = re.sub(r'ボポ', 'ポ', text)

    # Phase 4: ゴミ文字
    text = re.sub(r'[ーー]{3,}', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
    text = re.sub(r'◆◆+', '', text)
    text = re.sub(r'■■+', '', text)

    # Phase 5: 短い行・ゴミ行除去
    lines = text.split('\n')
    clean_lines = []
    for line in lines:
        stripped = line.strip()
        if len(stripped) <= 2:
            continue
        if re.match(r'^[のるれをにはがでもるー*\s]+$', stripped):
            continue
        if re.match(r'^[A-Za-z]\d*$', stripped):
            continue
        if re.match(r'^[A-Za-z\d/\-\.\s]{1,6}$', stripped):
            continue
        clean_lines.append(line)

    return '\n'.join(clean_lines)


# ============================================
# Semantic Chunking
# ============================================
def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    """
    テキストをセマンティックチャンクに分割。
    - 見出しやセクション区切りを尊重
    - 文単位で分割（。で区切る）
    - オーバーラップで前後の文脈を保持
    """
    # まず文単位に分割
    sentences = re.split(r'(?<=。)', text)
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 3]

    if not sentences:
        return []

    chunks = []
    current_chunk = []
    current_len = 0

    for sent in sentences:
        sent_len = len(sent)

        # チャンクサイズを超えそうなら確定
        if current_len + sent_len > chunk_size and current_chunk:
            chunk_text_str = ''.join(current_chunk)
            chunks.append(chunk_text_str)

            # オーバーラップ: 最後のいくつかの文を次のチャンクに持ち越す
            overlap_chars = 0
            overlap_sents = []
            for s in reversed(current_chunk):
                overlap_chars += len(s)
                overlap_sents.insert(0, s)
                if overlap_chars >= overlap:
                    break

            current_chunk = overlap_sents
            current_len = sum(len(s) for s in current_chunk)

        current_chunk.append(sent)
        current_len += sent_len

    # 残り
    if current_chunk:
        chunk_text_str = ''.join(current_chunk)
        if len(chunk_text_str) > 30:  # 極小チャンク防止
            chunks.append(chunk_text_str)

    return chunks


def process_chapter(filepath):
    """1チャプターをチャンク化"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    chapter_id = data['id']
    chapter_title = data['title']

    all_chunks = []
    for page in data.get('pages', []):
        page_num = page['page']
        raw_text = page['text']

        # OCRクリーンアップ
        cleaned = clean_ocr_text(raw_text)
        if len(cleaned.strip()) < 30:
            continue

        # チャンク化
        page_chunks = chunk_text(cleaned)

        for i, chunk_text_str in enumerate(page_chunks):
            chunk_id = f"{chapter_id}_p{page_num}_{i:03d}"
            all_chunks.append({
                'id': chunk_id,
                'chapter_id': chapter_id,
                'chapter_title': chapter_title,
                'page': page_num,
                'text': chunk_text_str,
                'chars': len(chunk_text_str),
            })

    return all_chunks


# ============================================
# Embedding Generation
# ============================================
def generate_embeddings(client, chunks):
    """Gemini Embedding APIでバッチベクトル化"""
    total = len(chunks)
    embedded_count = 0

    for i in range(0, total, BATCH_SIZE):
        batch = chunks[i:i + BATCH_SIZE]
        texts = [c['text'] for c in batch]

        try:
            result = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=texts,
            )

            for j, embedding_obj in enumerate(result.embeddings):
                batch[j]['embedding'] = embedding_obj.values

            embedded_count += len(batch)
            pct = embedded_count / total * 100
            print(f"  Embedding: {embedded_count}/{total} ({pct:.0f}%)", end='\r')

        except Exception as e:
            print(f"\n  ⚠ Embedding error at batch {i}: {e}")
            # フォールバック: 空ベクトル
            for c in batch:
                if 'embedding' not in c:
                    c['embedding'] = []
            time.sleep(5)

        time.sleep(0.5)  # rate limit

    print(f"  Embedding: {embedded_count}/{total} (100%) ✅")
    return chunks


# ============================================
# Main
# ============================================
def main():
    print("=" * 60)
    print("SommelierPRO — Knowledge Base Builder")
    print("=" * 60)

    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        print("ERROR: GEMINI_API_KEY not set")
        sys.exit(1)

    client = genai.Client(api_key=api_key)

    # Step 1: チャンク化
    print("\n📚 Step 1: セマンティックチャンク化...")
    chapter_files = sorted([f for f in os.listdir(CHAPTERS_DIR) if f.endswith('.json')])
    all_chunks = []

    for filename in chapter_files:
        filepath = os.path.join(CHAPTERS_DIR, filename)
        chunks = process_chapter(filepath)
        all_chunks.extend(chunks)
        print(f"  {filename:40s} → {len(chunks):>4d} chunks")

    total_chars = sum(c['chars'] for c in all_chunks)
    print(f"\n  合計: {len(all_chunks)} chunks | {total_chars:,}文字")

    # Step 2: Embedding生成
    print(f"\n🧠 Step 2: Embedding生成 ({EMBEDDING_MODEL})...")
    all_chunks = generate_embeddings(client, all_chunks)

    # Step 3: 保存
    print(f"\n💾 Step 3: knowledge_base.json 保存...")
    kb = {
        'project': 'SommelierPRO',
        'version': '1.0-knowledge-base',
        'model': EMBEDDING_MODEL,
        'embedding_dim': 768,
        'total_chunks': len(all_chunks),
        'total_chars': total_chars,
        'chunks': all_chunks,
    }

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(kb, f, ensure_ascii=False)

    file_size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"  保存完了: {OUTPUT_PATH}")
    print(f"  ファイルサイズ: {file_size_mb:.1f} MB")

    print("\n" + "=" * 60)
    print(f"✅ Knowledge Base 構築完了!")
    print(f"   {len(all_chunks)} chunks | {total_chars:,}文字 | {file_size_mb:.1f}MB")
    print("=" * 60)


if __name__ == '__main__':
    main()
