#!/usr/bin/env python3
"""
SommelierPRO — Phase 0: OCR品質保証バッチ
ページ単位でGemini AIにOCR誤字修正のみを依頼する。

10段階に分割:
  Stage 1:  ch00 (ワイン概論)           34p
  Stage 2:  ch01 (酒類飲料概論)         39p
  Stage 3:  ch02 + ch03 (飲料/日本)     56p
  Stage 4:  ch04 + ch05前半 (豪NZ/仏前半) 106p
  Stage 5:  ch05後半 (仏後半)           60p
  Stage 6:  ch06 (イタリア)             66p
  Stage 7:  ch07 + ch08 + ch09 (西/独/葡)  95p
  Stage 8:  ch10 + ch11 + ch12 + ch13 (米州) 104p
  Stage 9:  ch14 ~ ch19 (欧州その他)    155p
  Stage 10: ch20 ~ ch25 (プロフェッショナル) 73p
"""

import json
import os
import sys
import time
import copy
from google import genai

# ---- Config ----
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CHAPTERS_DIR = os.path.join(SCRIPT_DIR, '..', 'data', 'chapters')
BACKUP_DIR = os.path.join(SCRIPT_DIR, '..', 'data', 'chapters_backup')

STAGES = {
    1:  ['ch00_wine_overview'],
    2:  ['ch01_spirits_overview'],
    3:  ['ch02_beverages_overview', 'ch03_japan'],
    4:  ['ch04_australia_nz'],   # ch05前半は別途
    5:  ['ch05_france'],
    6:  ['ch06_italy'],
    7:  ['ch07_spain', 'ch08_germany', 'ch09_portugal'],
    8:  ['ch10_usa', 'ch11_chile', 'ch12_south_america', 'ch13_canada'],
    9:  ['ch14_austria', 'ch15_hungary', 'ch16_central_eastern_europe',
         'ch17_greece_georgia', 'ch18_switzerland_uk', 'ch19_south_africa'],
    10: ['ch20_tasting', 'ch21_cheese', 'ch22_pairing',
         'ch23_wine_management', 'ch24_sommelier', 'ch25_jsa_exam'],
}

OCR_CORRECTION_PROMPT = """あなたはOCR校正の最高専門家である。
以下のワイン専門テキストはPDFからOCRで抽出されたものであり、多数の誤認識が含まれている。

【厳守ルール】
1. OCRの文字化け・誤認識のみを修正せよ
2. 文章の意味・内容・構成は絶対に変更するな
3. 数値（面積、生産量、年号、人口等）は元テキストのまま保持せよ
4. ワイン専門用語（品種名、産地名、A.O.C.名等）は正確なスペルに修正せよ
5. 特例として、外国語の単語（ワイン名、産地、ブドウ品種など）が登場する場合は、可能な限り直後にカッコ書きでカタカナのふりがなを追記せよ（例: Pinot Noir（ピノ・ノワール））。この追記はルール2の例外とする。
6. 日本語の漢字・カタカナ・ひらがなの誤認識を正しく直せ
7. 存在しない単語を創作するな（ハルシネーション厳禁）
8. 改行位置は保持し、段落構造を維持せよ
9. 修正に確信がない箇所はそのまま残せ

【よくあるOCR誤認識パターン】
- 「人晶」→「人口」
- 「共和油」→「共和制」
- 「像偶政権」→「傀儡政権」
- 「がリア人」→「ガリア人」
- 「信泰」→「信奉」
- 「避体拝領」→「聖体拝領」
- 「六角形あをし」→「六角形をし」
- 「対戦」→「大戦」（文脈による）
- カタカナの濁点落ち（「シヤルドネ」→「シャルドネ」）
- 漢字の偏旁の取り違え

以下のテキストを修正してください。修正後のテキストのみを出力し、説明は不要です。"""


def correct_page(client, text):
    """1ページ分のOCRテキストをGemini AIで修正"""
    if len(text.strip()) < 20:
        return text

    try:
        response = client.models.generate_content(
            model='gemini-flash-lite-latest',
            contents=f"{OCR_CORRECTION_PROMPT}\n\n---\n{text}\n---",
            config={
                'temperature': 0.1,
                'max_output_tokens': 8192,
            }
        )
        corrected = response.text.strip()

        # 安全弁: 修正後のテキストが極端に短い or 長い場合は元テキストを保持
        ratio = len(corrected) / len(text) if len(text) > 0 else 1
        if ratio < 0.5 or ratio > 2.0:
            print(f"    ⚠ 修正が極端 (ratio={ratio:.2f}), 元テキスト保持")
            return text

        return corrected

    except Exception as e:
        print(f"    ⚠ API error: {e}")
        time.sleep(3)
        return text


def process_stage(stage_num):
    """指定ステージのチャプターを処理"""
    if stage_num not in STAGES:
        print(f"ERROR: Stage {stage_num} not found (1-10)")
        sys.exit(1)

    chapter_ids = STAGES[stage_num]
    print(f"\n{'='*60}")
    print(f"Phase 0 — Stage {stage_num}/10")
    print(f"対象: {', '.join(chapter_ids)}")
    print(f"{'='*60}")

    api_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
    if not api_key:
        print("ERROR: GEMINI_API_KEY not set")
        sys.exit(1)

    client = genai.Client(api_key=api_key)

    # バックアップ
    os.makedirs(BACKUP_DIR, exist_ok=True)

    total_pages = 0
    total_corrections = 0

    for chapter_id in chapter_ids:
        filepath = os.path.join(CHAPTERS_DIR, f"{chapter_id}.json")
        if not os.path.exists(filepath):
            print(f"  SKIP: {filepath} not found")
            continue

        # バックアップ
        backup_path = os.path.join(BACKUP_DIR, f"{chapter_id}.json")
        if not os.path.exists(backup_path):
            with open(filepath, 'r') as f:
                with open(backup_path, 'w') as bf:
                    bf.write(f.read())
            print(f"  📦 Backup: {chapter_id}")

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        pages = data.get('pages', [])
        print(f"\n  📖 {data['title']} ({len(pages)}ページ)")

        for i, page in enumerate(pages):
            original = page['text']
            corrected = correct_page(client, original)

            # diff検出
            if corrected != original:
                total_corrections += 1
                diff_chars = abs(len(corrected) - len(original))
                print(f"    p.{page['page']:>3d} ✏️  修正あり (±{diff_chars}文字)")
            else:
                print(f"    p.{page['page']:>3d} ✓  変更なし")

            page['text'] = corrected
            page['chars'] = len(corrected)
            total_pages += 1

            time.sleep(0.3)  # rate limit

        # 上書き保存
        # char_count再計算
        data['char_count'] = sum(p['chars'] for p in pages)

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"  💾 保存完了: {chapter_id} ({data['char_count']:,}文字)")

    print(f"\n{'='*60}")
    print(f"✅ Stage {stage_num} 完了!")
    print(f"   処理: {total_pages}ページ | 修正: {total_corrections}ページ")
    print(f"{'='*60}")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 phase0_ocr_qa.py <stage_number>")
        print("  stage_number: 1-10")
        print("\nStages:")
        for k, v in STAGES.items():
            print(f"  {k:>2d}: {', '.join(v)}")
        sys.exit(0)

    stages = [int(s) for s in sys.argv[1:]]
    for stage in stages:
        process_stage(stage)
