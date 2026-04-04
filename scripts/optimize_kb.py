#!/usr/bin/env python3
"""
Knowledge Base Optimizer
137MB → 軽量版（テキスト+メタデータ）+ ベクトルインデックス（バイナリ）に分離
フロントエンド用: knowledge_lite.json (テキストのみ、KB検索用metadata)
ベクトルインデックス: knowledge_vectors.bin (Float32バイナリ)
"""

import json
import os
import struct
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'data')
KB_PATH = os.path.join(DATA_DIR, 'knowledge_base.json')
LITE_PATH = os.path.join(DATA_DIR, 'knowledge_lite.json')
VECTORS_PATH = os.path.join(DATA_DIR, 'knowledge_vectors.bin')

def main():
    print("Loading knowledge_base.json...")
    with open(KB_PATH, 'r', encoding='utf-8') as f:
        kb = json.load(f)

    chunks = kb['chunks']
    dim = kb.get('embedding_dim', 768)
    total = len(chunks)
    print(f"  {total} chunks, {dim}D embeddings")

    # 1. Lite JSON (テキスト + メタデータ、embedding除去)
    lite_chunks = []
    for c in chunks:
        lite_chunks.append({
            'id': c['id'],
            'chapter_id': c['chapter_id'],
            'chapter_title': c['chapter_title'],
            'page': c['page'],
            'text': c['text'],
            'chars': c['chars'],
        })

    lite = {
        'project': kb['project'],
        'version': kb['version'] + '-lite',
        'total_chunks': total,
        'total_chars': kb['total_chars'],
        'embedding_dim': dim,
        'chunks': lite_chunks,
    }

    with open(LITE_PATH, 'w', encoding='utf-8') as f:
        json.dump(lite, f, ensure_ascii=False)

    lite_size = os.path.getsize(LITE_PATH) / (1024 * 1024)
    print(f"  knowledge_lite.json: {lite_size:.1f} MB")

    # 2. Binary vectors (Float32, packed)
    with open(VECTORS_PATH, 'wb') as f:
        # Header: chunk_count (uint32) + dim (uint32)
        f.write(struct.pack('<II', total, dim))

        for c in chunks:
            emb = c.get('embedding', [])
            if len(emb) != dim:
                emb = [0.0] * dim  # fallback
            f.write(struct.pack(f'<{dim}f', *emb))

    vec_size = os.path.getsize(VECTORS_PATH) / (1024 * 1024)
    print(f"  knowledge_vectors.bin: {vec_size:.1f} MB")

    print(f"\n✅ 分離完了!")
    print(f"   元: {os.path.getsize(KB_PATH)/(1024*1024):.1f} MB")
    print(f"   Lite: {lite_size:.1f} MB + Vectors: {vec_size:.1f} MB = {lite_size+vec_size:.1f} MB")

if __name__ == '__main__':
    main()
