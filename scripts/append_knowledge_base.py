#!/usr/bin/env python3
"""
SommelierPRO — Knowledge Base Appender (2025 Edition)
Append new 2025 chapters to knowledge_base.json without overwriting the original 163万文字.
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
KB_PATH = os.path.join(DATA_DIR, 'knowledge_base.json')

# ---- Config ----
CHUNK_SIZE = 700       
CHUNK_OVERLAP = 100    
EMBEDDING_MODEL = 'gemini-embedding-001'
BATCH_SIZE = 20        

def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    sentences = re.split(r'(?<=。)', text)
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 3]

    if not sentences:
        return []

    chunks = []
    current_chunk = []
    current_len = 0

    for sent in sentences:
        sent_len = len(sent)
        if current_len + sent_len > chunk_size and current_chunk:
            chunks.append(''.join(current_chunk))
            overlap_chars = 0
            overlap_sents = []
            for s in reversed(current_chunk):
                overlap_chars += len(s)
                overlap_sents.insert(0, s)
                if overlap_chars >= overlap: break
            current_chunk = overlap_sents
            current_len = sum(len(s) for s in current_chunk)
            
        current_chunk.append(sent)
        current_len += sent_len

    if current_chunk:
        chunk_text_str = ''.join(current_chunk)
        if len(chunk_text_str) > 30:
            chunks.append(chunk_text_str)
            
    return chunks

def process_chapter(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    chapter_id = data['id']
    chapter_title = data['title']
    all_chunks = []
    for page in data.get('pages', []):
        page_num = page['page']
        raw_text = page['text']
        if len(raw_text.strip()) < 30: continue
        page_chunks = chunk_text(raw_text)
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

def generate_embeddings(client, chunks):
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
            print(f"  Embedding: {embedded_count}/{total}", end='\r')
        except Exception as e:
            print(f"\n  ⚠ Embedding error: {e}")
            for c in batch:
                if 'embedding' not in c: c['embedding'] = []
            time.sleep(2)
        time.sleep(0.5)
    print(f"\n  Embedding: {embedded_count}/{total} (100%) ✅")
    return chunks

def main():
    print("=" * 60)
    print("SommelierPRO — Knowledge Base Appender")
    print("=" * 60)

    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        print("ERROR: GEMINI_API_KEY not set")
        sys.exit(1)
        
    client = genai.Client(api_key=api_key)

    print("\n📚 Loading existing knowledge base...")
    if not os.path.exists(KB_PATH):
        print("ERROR: knowledge_base.json not found!")
        sys.exit(1)
        
    with open(KB_PATH, 'r', encoding='utf-8') as f:
        kb = json.load(f)
        
    existing_chapter_ids = {c['chapter_id'] for c in kb['chunks']}
    print(f"  Existing chunks: {len(kb['chunks'])}")
    print(f"  Existing chapters: {len(existing_chapter_ids)}")

    print("\n📚 Checking for new chapters...")
    chapter_files = sorted([f for f in os.listdir(CHAPTERS_DIR) if f.endswith('.json')])
    new_chunks = []
    
    for filename in chapter_files:
        if not ("_2025_" in filename and filename.startswith("ch")):
            continue
            
        filepath = os.path.join(CHAPTERS_DIR, filename)
        ch_id = filename.replace('.json', '')
        
        if ch_id in existing_chapter_ids:
            # print(f"  Skipping {ch_id} (already in KB)")
            continue
            
        chunks = process_chapter(filepath)
        new_chunks.extend(chunks)
        print(f"  Newly parsed: {filename:25s} → {len(chunks):>4d} chunks")

    if not new_chunks:
        print("\n✅ No new chapters to embed. Knowledge Base is up to date!")
        return

    print(f"\n🧠 Embedding {len(new_chunks)} new chunks...")
    embedded_chunks = generate_embeddings(client, new_chunks)

    # Append
    kb['chunks'].extend(embedded_chunks)
    kb['total_chunks'] = len(kb['chunks'])
    kb['total_chars'] = sum(c['chars'] for c in kb['chunks'])

    print(f"\n💾 Saving knowledge_base.json...")
    with open(KB_PATH, 'w', encoding='utf-8') as f:
        json.dump(kb, f, ensure_ascii=False)

    print(f"✅ Appended successfully! Total Chunks: {kb['total_chunks']} | Total Chars: {kb['total_chars']}")

if __name__ == '__main__':
    main()
