#!/usr/bin/env python3
"""
SommelierPRO — Phase 0: 用語ゆらぎ統一バッチ (Rule-based Standardization)
Gemini AIによる文脈的清書の「後」に実行し、AIでも拾い漏らした表記ゆれを
ルールベースで一斉に書き換える。
"""

import json
import os
import glob

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CHAPTERS_DIR = os.path.join(SCRIPT_DIR, '..', 'data', 'chapters')
DICT_FILE = os.path.join(SCRIPT_DIR, '..', 'data', 'canonical_terms.json')

def load_canonical_terms():
    with open(DICT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 辞書を単一次元にフラット化 { "悪い用語": "正しい用語" }
    flat_dict = {}
    for category in data.values():
        for canonical, variants in category.items():
            for variant in variants:
                flat_dict[variant] = canonical
    
    # 置換時に長い文字列から先に評価するためソート（例: "A.0.C." が "AOC" より先）
    sorted_variants = sorted(flat_dict.keys(), key=len, reverse=True)
    return flat_dict, sorted_variants

def main():
    print("="*60)
    print("🍾 Phase 0: 用語ゆらぎ統一バッチ")
    print("="*60)
    
    flat_dict, sorted_variants = load_canonical_terms()
    print(f"✅ 置換ルール {len(flat_dict)} 件をロードしました。")
    
    total_replacements = 0
    files_modified = 0
    
    for filepath in sorted(glob.glob(os.path.join(CHAPTERS_DIR, '*.json'))):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        modified = False
        chapter_replacements = 0
        
        for page in data.get('pages', []):
            text = page['text']
            for variant in sorted_variants:
                if variant in text:
                    count = text.count(variant)
                    text = text.replace(variant, flat_dict[variant])
                    chapter_replacements += count
                    modified = True
                    # print(f"    [p.{page['page']}] {variant} -> {flat_dict[variant]} ({count}回)")
            
            page['text'] = text
            page['chars'] = len(text)
            
        if modified:
            data['char_count'] = sum(p['chars'] for p in data.get('pages', []))
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            print(f"  📝 {data['id']}: {chapter_replacements} 箇所のゆらぎを修正")
            total_replacements += chapter_replacements
            files_modified += 1
        else:
            print(f"  ✓ {data['id']}: 修正なし")

    print(f"\n{'='*60}")
    print(f"🎉 処理完了: {files_modified} ファイル / 計 {total_replacements} 箇所を統一")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
