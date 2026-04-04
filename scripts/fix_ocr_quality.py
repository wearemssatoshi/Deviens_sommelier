#!/usr/bin/env python3
"""
ソムリエPRO — OCR品質修正スクリプト (5-Pass)
教本テキストの文字崩れを5回精査して修正する
"""

import json
import re
import os
import copy

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
CHAPTERS_DIR = os.path.join(DATA_DIR, 'chapters')


# ============================================
# PASS 1: 明らかなOCR誤変換（パターン辞書）
# ============================================

OCR_REPLACEMENTS = {
    # 頻出パターン
    'をの': 'その',
    'きれる': 'される',
    'きせる': 'させる',
    'きれた': 'された',
    'きせた': 'させた',
    'きせて': 'させて',
    'きれて': 'されて',
    'きれ、': 'され、',
    'きれず': 'されず',
    # アルコール系
    'アテルコール': 'アルコール',
    'アデルコール': 'アルコール',
    'アモトアルデ': 'アセトアルデ',
    'アセモトアルデ': 'アセトアルデ',
    # 漢字誤変換
    '蒸留酒須': '蒸留酒類',
    '酒頻': '酒類',
    '本和': '基本',  # context-dependent
    '了造': '醸造',
    '了醸造': '醸造',
    '了臨む': '臨む',
    '了肉': '肉',
    # 助詞・助動詞
    'ほ上': 'として',
    'ほしての': 'としての',
    'ほとなっている': 'となっている',
    'ほいわれる': 'といわれる',
    # $→も
    '$の': 'もの',
    '$ある': 'もある',
    '$あり': 'もあり',
    '$多い': 'も多い',
    '$いる': 'もいる',
    '$殺菌': 'も殺菌',
    # え→え
    'えぇ': 'え',
    'きるにく': 'にく',
    # 特殊
    '定義8': '定義',
    '匠焼酎': '蒸留焼酎',
    '匠本': '蒸本',
    '本焼酎': '蒸焼酎',
    '続式匠': '続式蒸',
    'カビ臭': 'カビ臭',
    '看白質': '蛋白質',
    '和蛋白': 'タンパク',
    '精質': '糖質',
    '和有機酸': 'の有機酸',
    '和本': 'の基本',
    '和夫': 'の夫',
    '和容病': '晩腐病',
    '和酢酸': 'の酢酸',
    '和table': 'Table',
    '和maturite': 'Maturité',
    '和人硫酸': '亜硫酸',
    '和夜の': 'の夜の',
    '和自然': 'の自然',
    '和面': '表面',
    '和独自': 'の独自',
    '和生': 'の生',
    '状分': '養分',
    '収載味': '渋味',
    '殻物': '穀物',
    '毅物': '穀物',
    '淀んだ': '淀んだ',
    '磨画': '壁画',
    'EEもに': 'とともに',
    'RE': 'は',
    'EE': 'と',
    # 数字混入
    '2と': 'ことと',
    '5の': 'もの',
    # フランス語特殊文字
    'ée': 'ée',
    'è': 'è',
    '6levage': 'élevage',
}


def pass1_pattern_replace(text):
    """Pass 1: パターンベースの置換"""
    for old, new in OCR_REPLACEMENTS.items():
        text = text.replace(old, new)
    return text


# ============================================
# PASS 2: 文脈崩壊の修正
# ============================================

def pass2_context_fix(text):
    """Pass 2: 文脈崩壊の検出・修正"""
    # 表データの列ずれ・行結合の検出
    # 不自然な改行の除去（文の途中での改行）
    lines = text.split('\n')
    fixed_lines = []
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # 完全に意味不明な行（記号だけ）をスキップ
        if stripped and all(c in '|ー一ーー-=※↓↑→←◆◇○●□■△▲▽▼☆★♦♣♠♥　 ' for c in stripped):
            continue
        
        # 数字のみの行（ページ番号）をスキップ
        if stripped and stripped.isdigit() and len(stripped) <= 3:
            continue
            
        fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)


# ============================================
# PASS 3: 論理整合性チェック
# ============================================

def pass3_logic_check(text):
    """Pass 3: 論理整合性チェック"""
    # 重複行の除去
    lines = text.split('\n')
    seen = set()
    deduped = []
    for line in lines:
        stripped = line.strip()
        if stripped and len(stripped) > 20:
            if stripped in seen:
                continue
            seen.add(stripped)
        deduped.append(line)
    
    return '\n'.join(deduped)


# ============================================
# PASS 4: 専門用語の統一
# ============================================

TERM_NORMALIZATION = {
    'ぶどう': 'ブドウ',
    '葡萄': 'ブドウ',
    'ぷどう': 'ブドウ',
    'プドウ': 'ブドウ',
    'りんご酸': 'リンゴ酸',
    'ワインメーカー': 'ワインメーカー',
}

def pass4_term_normalize(text):
    """Pass 4: 専門用語の統一"""
    for old, new in TERM_NORMALIZATION.items():
        text = text.replace(old, new)
    return text


# ============================================
# PASS 5: 最終構造チェック
# ============================================

def pass5_structure_check(text):
    """Pass 5: 構造チェック"""
    # 過度な空行を圧縮
    text = re.sub(r'\n{4,}', '\n\n\n', text)
    
    # 文末の不自然な切断を修正（文の途中で終わる行を次行と結合）
    lines = text.split('\n')
    merged = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # 行末が中途半端（助詞で終わる等）で次の行が続きの場合
        if (line.strip() and 
            not line.strip().endswith(('。', '」', '）', ')', '、', '：', ':', '※')) and
            not line.strip().endswith(('.', ',')) and
            i + 1 < len(lines) and 
            lines[i+1].strip() and 
            not lines[i+1].strip().startswith(('・', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
                                               '(', '（', '[', '【', '■', '●', '◆', '▶', 
                                               '英', '仏', '独', '伊'))):
            # 次の行の最初の文字が小文字ひらがな等なら結合候補
            pass  # 結合は慎重に行う必要があるため、ここでは保留
        merged.append(line)
        i += 1
    
    return '\n'.join(merged)


# ============================================
# MAIN PROCESSOR
# ============================================

def process_chapter(filepath):
    """1チャプターを5-Pass処理"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    original_chars = 0
    fixed_chars = 0
    changes = 0
    
    for page in data.get('pages', []):
        original = page['text']
        original_chars += len(original)
        
        # 5-Pass Processing
        text = original
        text = pass1_pattern_replace(text)
        text = pass2_context_fix(text)
        text = pass3_logic_check(text)
        text = pass4_term_normalize(text)
        text = pass5_structure_check(text)
        
        if text != original:
            changes += 1
        
        page['text'] = text
        page['chars'] = len(text)
        fixed_chars += len(text)
    
    # 更新
    data['char_count'] = fixed_chars
    data['version'] = '1.1-ocr-fixed'
    
    return data, changes, original_chars, fixed_chars


def main():
    print("=" * 60)
    print("ソムリエPRO — OCR品質修正 (5-Pass)")
    print("=" * 60)
    
    chapter_files = sorted([f for f in os.listdir(CHAPTERS_DIR) if f.endswith('.json')])
    
    total_changes = 0
    total_original = 0
    total_fixed = 0
    
    for filename in chapter_files:
        filepath = os.path.join(CHAPTERS_DIR, filename)
        data, changes, orig, fixed = process_chapter(filepath)
        
        total_changes += changes
        total_original += orig
        total_fixed += fixed
        
        # 上書き保存
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        delta = orig - fixed
        status = f"✅ {changes}ページ修正" if changes > 0 else "— 変更なし"
        print(f"  {data.get('title', filename):20s} | {status} | Δ{delta:+d}文字")
    
    print("=" * 60)
    print(f"合計: {total_changes}ページ修正 | {total_original:,} → {total_fixed:,}文字")
    print("=" * 60)


if __name__ == '__main__':
    main()
