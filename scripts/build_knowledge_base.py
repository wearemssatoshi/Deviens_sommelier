#!/usr/bin/env python3
"""
SommelierPRO — Knowledge Base Builder v2.0
163万文字の教本OCRテキスト + 手動書き起こしデータをセマンティックチャンクに分割し、
Gemini Embedding APIでベクトル化して knowledge_base.json を生成する。

v2.0 Changes (KAI + G collaboration):
  1. チャプターソース判定: OCR (ch00-ch25) vs Manual (ch26+) で処理分岐
  2. テーブル対応チャンカー: マークダウンテーブルを保護
  3. 差分ビルド基盤: --chunk-only モード + 既存KB再利用
"""

import json
import os
import re
import time
import sys
import hashlib
from google import genai

# ---- Paths ----
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'data')
CHAPTERS_DIR = os.path.join(DATA_DIR, 'chapters')
OUTPUT_PATH = os.path.join(DATA_DIR, 'knowledge_base.json')
LITE_OUTPUT_PATH = os.path.join(DATA_DIR, 'knowledge_lite.json')

# ---- Config ----
CHUNK_SIZE = 700       # target chars per chunk
CHUNK_OVERLAP = 100    # overlap chars between chunks
EMBEDDING_MODEL = 'gemini-embedding-001'
BATCH_SIZE = 20        # embeddings per batch request
MANUAL_CHAPTER_THRESHOLD = 26  # ch26+ are manually transcribed


# ============================================
# 1. Source Type Detection
# ============================================
def is_manual_chapter(chapter_id):
    """ch26以降は手動書き起こしデータ（OCRクリーンアップ不要）"""
    match = re.match(r'ch(\d+)', chapter_id)
    if match:
        return int(match.group(1)) >= MANUAL_CHAPTER_THRESHOLD
    return False


# ============================================
# 2. OCR Cleanup (ch00-ch25 only)
# ============================================
def clean_ocr_text(text):
    """OCRノイズ除去 — OCR由来チャプター（ch00-ch25）のみに適用"""
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


def clean_manual_text(text):
    """手動書き起こしデータの軽微クリーンアップ（構造を壊さない）"""
    # 制御文字のみ除去
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
    # 過剰な空行のみ整理
    text = re.sub(r'\n{4,}', '\n\n\n', text)
    return text


# ============================================
# 3. Table-Aware Semantic Chunking
# ============================================
def split_into_blocks(text):
    """テキストを「テーブルブロック」と「テキストブロック」に分割"""
    lines = text.split('\n')
    blocks = []
    current_block = []
    current_type = None  # 'table' or 'text'

    for line in lines:
        stripped = line.strip()
        is_table_line = stripped.startswith('|') or re.match(r'^\|[-\s|:]+\|$', stripped)

        if is_table_line:
            if current_type == 'text' and current_block:
                blocks.append(('text', '\n'.join(current_block)))
                current_block = []
            current_type = 'table'
            current_block.append(line)
        else:
            if current_type == 'table' and current_block:
                blocks.append(('table', '\n'.join(current_block)))
                current_block = []
            current_type = 'text'
            current_block.append(line)

    if current_block:
        blocks.append((current_type or 'text', '\n'.join(current_block)))

    return blocks


def chunk_text_block(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    """通常テキストを文単位でチャンク化（従来ロジック）"""
    sentences = re.split(r'(?<=。)', text)
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 3]

    if not sentences:
        # 。がない場合は改行で分割
        sentences = [s.strip() for s in text.split('\n') if s.strip() and len(s.strip()) > 3]

    if not sentences:
        return [text] if len(text.strip()) > 30 else []

    chunks = []
    current_chunk = []
    current_len = 0

    for sent in sentences:
        sent_len = len(sent)

        if current_len + sent_len > chunk_size and current_chunk:
            chunk_text_str = '\n'.join(current_chunk) if '\n' in text else ''.join(current_chunk)
            chunks.append(chunk_text_str)

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

    if current_chunk:
        chunk_text_str = '\n'.join(current_chunk) if '\n' in text else ''.join(current_chunk)
        if len(chunk_text_str) > 30:
            chunks.append(chunk_text_str)

    return chunks


def chunk_table_block(table_text, chunk_size=CHUNK_SIZE):
    """テーブルブロックをテーブル構造を保持したままチャンク化"""
    lines = table_text.split('\n')

    # ヘッダー行（最初の|行とセパレータ行）を特定
    header_lines = []
    data_lines = []
    header_done = False

    for line in lines:
        stripped = line.strip()
        if not header_done:
            header_lines.append(line)
            # セパレータ行（|---|---|）を検出したらヘッダー完了
            if re.match(r'^\|[-\s|:]+\|$', stripped):
                header_done = True
        else:
            data_lines.append(line)

    # ヘッダーがない場合は全てデータ行
    if not header_done:
        data_lines = header_lines
        header_lines = []

    header_text = '\n'.join(header_lines)
    header_len = len(header_text)

    # テーブル全体がチャンクサイズ内なら丸ごと1チャンク
    if len(table_text) <= chunk_size * 1.5:  # テーブルは1.5倍まで許容
        return [table_text]

    # 大きいテーブルはヘッダー付きで行単位分割
    chunks = []
    current_rows = []
    current_len = header_len

    for row in data_lines:
        row_len = len(row) + 1  # +1 for newline

        if current_len + row_len > chunk_size and current_rows:
            chunk = header_text + '\n' + '\n'.join(current_rows) if header_text else '\n'.join(current_rows)
            chunks.append(chunk)
            current_rows = []
            current_len = header_len

        current_rows.append(row)
        current_len += row_len

    if current_rows:
        chunk = header_text + '\n' + '\n'.join(current_rows) if header_text else '\n'.join(current_rows)
        if len(chunk) > 30:
            chunks.append(chunk)

    return chunks


def chunk_text_table_aware(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    """テーブル対応セマンティックチャンカー（メインエントリーポイント）"""
    blocks = split_into_blocks(text)
    all_chunks = []

    for block_type, block_text in blocks:
        if not block_text.strip() or len(block_text.strip()) < 10:
            continue

        if block_type == 'table':
            table_chunks = chunk_table_block(block_text, chunk_size)
            all_chunks.extend(table_chunks)
        else:
            text_chunks = chunk_text_block(block_text, chunk_size, overlap)
            all_chunks.extend(text_chunks)

    return all_chunks


# ============================================
# 4. Chapter Processing
# ============================================
def compute_chapter_hash(filepath):
    """チャプターファイルのハッシュ（差分検出用）"""
    with open(filepath, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()


def process_chapter(filepath):
    """1チャプターをチャンク化（ソースタイプに応じた処理分岐）"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    chapter_id = data['id']
    chapter_title = data['title']
    is_manual = is_manual_chapter(chapter_id)

    all_chunks = []
    for page in data.get('pages', []):
        page_num = page['page']
        raw_text = page['text']

        # ソースタイプに応じたクリーンアップ
        if is_manual:
            cleaned = clean_manual_text(raw_text)
        else:
            cleaned = clean_ocr_text(raw_text)

        if len(cleaned.strip()) < 30:
            continue

        # テーブル対応チャンク化
        page_chunks = chunk_text_table_aware(cleaned)

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

    return all_chunks, is_manual


# ============================================
# 5. Embedding Generation
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
            print(f"\n  Embedding error at batch {i}: {e}")
            for c in batch:
                if 'embedding' not in c:
                    c['embedding'] = []
            time.sleep(5)

        time.sleep(0.5)  # rate limit

    print(f"  Embedding: {embedded_count}/{total} (100%)")
    return chunks


# ============================================
# 6. Differential Build Support
# ============================================
def load_existing_kb(path):
    """既存KBを読み込み、チャプターごとのチャンクとハッシュを返す"""
    if not os.path.exists(path):
        return {}, {}

    with open(path, 'r', encoding='utf-8') as f:
        kb = json.load(f)

    chunks_by_chapter = {}
    for chunk in kb.get('chunks', []):
        cid = chunk.get('chapter_id', '')
        if cid not in chunks_by_chapter:
            chunks_by_chapter[cid] = []
        chunks_by_chapter[cid].append(chunk)

    hashes = kb.get('chapter_hashes', {})
    return chunks_by_chapter, hashes


# ============================================
# Main
# ============================================
def main():
    chunk_only = '--chunk-only' in sys.argv
    diff_build = '--diff' in sys.argv

    print("=" * 60)
    print("SommelierPRO — Knowledge Base Builder v2.0")
    print("  KAI (code) + G (architecture)")
    print("=" * 60)

    if not chunk_only:
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            print("GEMINI_API_KEY not set. Use --chunk-only for chunking without embeddings.")
            sys.exit(1)
        client = genai.Client(api_key=api_key)
    else:
        client = None
        print("  Mode: chunk-only (no embeddings)")

    # 差分ビルド: 既存KBのハッシュを読み込み
    existing_chunks_by_chapter = {}
    existing_hashes = {}
    if diff_build:
        print("  Mode: differential build")
        existing_chunks_by_chapter, existing_hashes = load_existing_kb(OUTPUT_PATH)
        if not existing_hashes:
            existing_chunks_by_chapter, existing_hashes = load_existing_kb(LITE_OUTPUT_PATH)

    # Step 1: チャンク化
    print("\n Step 1: Table-Aware Semantic Chunking...")
    chapter_files = sorted([f for f in os.listdir(CHAPTERS_DIR) if f.endswith('.json')])
    all_chunks = []
    chapter_hashes = {}
    ocr_count = 0
    manual_count = 0
    reused_count = 0

    for filename in chapter_files:
        filepath = os.path.join(CHAPTERS_DIR, filename)
        file_hash = compute_chapter_hash(filepath)
        chapter_id = filename.replace('.json', '')
        chapter_hashes[chapter_id] = file_hash

        # 差分ビルド: ハッシュが一致すれば既存チャンクを再利用
        if diff_build and chapter_id in existing_hashes and existing_hashes[chapter_id] == file_hash:
            reused = existing_chunks_by_chapter.get(chapter_id, [])
            all_chunks.extend(reused)
            reused_count += 1
            print(f"  {filename:40s} -> {len(reused):>4d} chunks (reused)")
            continue

        chunks, is_manual = process_chapter(filepath)
        all_chunks.extend(chunks)

        source_tag = "manual" if is_manual else "OCR"
        if is_manual:
            manual_count += 1
        else:
            ocr_count += 1
        print(f"  {filename:40s} -> {len(chunks):>4d} chunks [{source_tag}]")

    total_chars = sum(c['chars'] for c in all_chunks)
    print(f"\n  Total: {len(all_chunks)} chunks | {total_chars:,} chars")
    print(f"  Sources: {ocr_count} OCR + {manual_count} manual" +
          (f" + {reused_count} reused" if reused_count else ""))

    # Step 2: Embedding生成
    if not chunk_only:
        # 差分ビルド: embeddingがないチャンクだけ処理
        chunks_to_embed = [c for c in all_chunks if 'embedding' not in c or not c['embedding']]
        if chunks_to_embed:
            print(f"\n Step 2: Embedding ({len(chunks_to_embed)} new chunks)...")
            generate_embeddings(client, chunks_to_embed)
        else:
            print(f"\n Step 2: All chunks already embedded. Skipping.")

        # 保存 (with embeddings)
        print(f"\n Step 3: Saving knowledge_base.json...")
        kb = {
            'project': 'SommelierPRO',
            'version': '2.0-knowledge-base',
            'model': EMBEDDING_MODEL,
            'embedding_dim': 768,
            'total_chunks': len(all_chunks),
            'total_chars': total_chars,
            'chapter_hashes': chapter_hashes,
            'chunks': all_chunks,
        }
        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(kb, f, ensure_ascii=False)

        file_size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
        print(f"  Saved: {OUTPUT_PATH} ({file_size_mb:.1f} MB)")

    # 常にlite版も保存（embeddingなし）
    print(f"\n Step {'3' if chunk_only else '4'}: Saving knowledge_lite.json...")
    lite_chunks = [{k: v for k, v in c.items() if k != 'embedding'} for c in all_chunks]
    kb_lite = {
        'project': 'SommelierPRO',
        'version': '2.0-knowledge-base-lite',
        'total_chunks': len(lite_chunks),
        'total_chars': total_chars,
        'embedding_dim': 768,
        'chapter_hashes': chapter_hashes,
        'chunks': lite_chunks,
    }
    with open(LITE_OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(kb_lite, f, ensure_ascii=False)

    lite_size_mb = os.path.getsize(LITE_OUTPUT_PATH) / (1024 * 1024)
    print(f"  Saved: {LITE_OUTPUT_PATH} ({lite_size_mb:.1f} MB)")

    print("\n" + "=" * 60)
    print(f"Knowledge Base v2.0 built!")
    print(f"  {len(all_chunks)} chunks | {total_chars:,} chars | lite={lite_size_mb:.1f}MB")
    if not chunk_only:
        print(f"  full={file_size_mb:.1f}MB")
    print("=" * 60)


if __name__ == '__main__':
    main()
