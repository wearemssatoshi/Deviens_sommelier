import json

INDEX_PATH = '/Users/satoshiiga/dotfiles/SommelierPRO/data/summaries/summary_index.json'

with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Remove the 4 split WSET cards
data['chapters'] = [ch for ch in data['chapters'] if 'wset_' not in ch['id'] or ch['id'] == 'wset_sat']

# Add the consolidated WSET card if not exists
consolidated = {
    "id": "wset_sat",
    "number": 26,
    "title": "WSET 体系的テイスティング",
    "title_en": "WSET SAT",
    "category": "WSET",
    "icon": "🍷",
    "description": "世界基準のワインテイスティング法。外観・香り・味わいを論理的に分析し、品質と熟成ポテンシャルを客観的に評価するプロフェッショナル・メソッド。",
    "page_count": 4,
    "char_count": 2000,
    "tier": "standard",
    "key_points": [
        "外観 (Appearance): 色調、濃淡、透明度による熟成状態の推測",
        "香り (Nose): 第1・第2・第3アロマの分類と香りの発達段階",
        "味わい (Palate): 甘味・酸味・タンニン・アルコール・ボディの構造評価",
        "結論 (Conclusion): BLIC基準（バランス・余韻・強さ・複雑性）による品質判定"
    ],
    "keywords": ["WSET", "SAT", "アロマ", "BLIC", "テイスティング", "品質評価"],
    "summary": "### 世界基準のテイスティング・アプローチ\nWSETが提唱するSystematic Approach to Tasting (SAT)は、個人の好みを排除し、ワインを論理的かつ客観的に分析・評価するための世界共通言語です。\n\n### 1. 外観 (Appearance) と 2. 香り (Nose)\n**外観**では、グラスを傾けて色の濃淡や色調（レモン色、ルビー色など）を観察し、気候や熟成状態を推測します。**香り**では、グラスを回して（スワリング）、健全度を確認した後、特徴を3つの層に分けて分析します。ブドウ由来の「第1アロマ」、醸造由来の「第2アロマ」、熟成由来の「第3アロマ」を嗅ぎ分けることで、ワインの複雑性と発育段階を捉えます。\n\n### 3. 味わい (Palate) と 4. 結論 (Conclusion)\n**味わい**では、甘味を舌先で、酸度を唾液の分泌量で、タンニンを歯茎の収斂性で測ります。同時にアルコールの熱感やボディ（重量感）を評価し、ワインの骨格（ストラクチャー）を解析します。\nこれら全ての要素を統合し、最終的な**結論**を下します。品質評価は「BLIC」（B: Balance/バランス、L: Length/余韻、I: Intensity/強さ、C: Complexity/複雑性）の4基準を用いて客観的に採点し、現在の飲み頃（熟成ポテンシャル）を判定します。",
    "summary_chars": 615,
    "deep_content": {
        "exam_tips": [],
        "classification_tables": {},
        "timeline": []
    }
}

# Check if it already exists
if not any(ch['id'] == 'wset_sat' for ch in data['chapters']):
    data['chapters'].append(consolidated)

data['total_chapters'] = len(data['chapters'])

with open(INDEX_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Consolidated WSET cards successfully.")
