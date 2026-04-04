# -*- coding: utf-8 -*-
import json
import os

INDEX_PATH = '/Users/satoshiiga/dotfiles/SommelierPRO/data/summaries/summary_index.json'

with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

# The new WSET cards
wset_cards = [
    {
        "id": "wset_appearance",
        "number": 101,
        "title": "WSET SAT - 外観 (Appearance)",
        "title_en": "WSET SAT - Appearance",
        "category": "PROFESSIONAL",
        "description": "テイスティングの第一段階。ワインの色調、濃淡、透明度を通じて、ブドウ品種、産地の気候、熟成状態を推測するプロフェッショナルな視覚分析。",
        "page_count": 1,
        "char_count": 500,
        "tier": "standard",
        "key_points": [
            "色調 (Colour): レモン、ゴールド、ルビー、ガーネットなど",
            "濃淡 (Intensity): 淡い、中程度、濃い",
            "透明度 (Clarity): 澄んだ、濁った"
        ],
        "keywords": ["Appearance", "Intensity", "Colour", "Ruby", "Garnet"],
        "summary": "### 外観の分析\nワインの外観は、そのワインの素性を探るための重要な第一歩です。白い背景に対してグラスを約45度傾け、真上や横から観察します。\n\n**色調 (Colour):**\n白ワインの場合はレモン色からアンバーまで、赤ワインの場合はパープルからトーニー（茶褐色）までのグラデーションを観察します。エッジ（縁）の色を見ることで熟成度合が分かります。\n\n**濃淡 (Intensity):**\n淡い（Pale）、中程度（Medium）、濃い（Deep）の3段階で評価します。赤ワインの場合、真上から見てステムが見えるかどうかが一つの基準となります。「濃い」ワインは、温暖な気候や果皮の厚い品種を示唆します。\n\n**透明度とその他の観察:**\n濁りの有無や、グラスを回した時に内側を流れ落ちる「脚（Tears/Legs）」の太さや落ちる速度を観察し、アルコール度数や残糖度を推測します。",
        "summary_chars": 500
    },
    {
        "id": "wset_nose",
        "number": 102,
        "title": "WSET SAT - 香り (Nose)",
        "title_en": "WSET SAT - Nose",
        "category": "PROFESSIONAL",
        "description": "テイスティングの第二段階。香りの健全度、強さ、そして第一・第二・第三アロマを分析し、ワインの複雑性と発育段階を捉える。",
        "page_count": 1,
        "char_count": 500,
        "tier": "standard",
        "key_points": [
            "健全度 (Condition): ブショネ（コルク臭）や酸化の有無",
            "強さ (Intensity): 香りのボリューム",
            "香りの特徴 (Aroma Characteristics): 第一（果実・花）、第二（オーク・醸造）、第三（熟成）"
        ],
        "keywords": ["Nose", "Aromas", "Primary", "Secondary", "Tertiary", "Cork taint"],
        "summary": "### 香りの分析\nグラスを静かに回し（スワリング）、空気に触れさせることで香りを引き出した後、鼻を近づけて深く香りをかいで分析します。\n\n**健全度と強さ:**\nまず、カビのようなコルク臭（TCA）や過度な酸化がないかを確認します。その後、香りの強さを「弱い」「中程度」「強い」で評価します。\n\n**アロマの階層:**\n*   **第1アロマ（Primary）:** ブドウ品種と気候に由来する香り。柑橘類、ベリー類、花、ハーブなど。\n*   **第2アロマ（Secondary）:** 醸造プロセス（オーク樽発酵、MLF熟成など）に由来する香り。バニラ、トースト、バターなど。\n*   **第3アロマ（Tertiary）:** 瓶熟成や樽熟成によって後から生じる香り。乾燥果実、キノコ、タバコ、なめし皮など。\n\nこれらの香りの層を嗅ぎ分けることで、ワインの複雑性とどの熟成段階にあるかを客観的に評価します。",
        "summary_chars": 500
    },
    {
        "id": "wset_palate",
        "number": 103,
        "title": "WSET SAT - 味わい (Palate)",
        "title_en": "WSET SAT - Palate",
        "category": "PROFESSIONAL",
        "description": "テイスティングの第三段階。甘辛、酸度、タンニン、アルコール、ボディを統合的に評価し、ワインの構造（ストラクチャー）を解析する。",
        "page_count": 1,
        "char_count": 500,
        "tier": "standard",
        "key_points": [
            "甘味 (Sweetness): 辛口から甘口まで",
            "酸度 (Acidity) と タンニン (Tannin): 骨格を形成する要素",
            "アルコール (Alcohol) と ボディ (Body): ワインの重量感"
        ],
        "keywords": ["Palate", "Sweetness", "Acidity", "Tannin", "Alcohol", "Body", "Finish"],
        "summary": "### 味わいの分析\n少量のワインを口に含み、口内全体に行き渡らせることで、舌全体と口腔内の粘膜でワインの構造要素を分析します。\n\n**基本構造の評価:**\n*   **甘味 (Sweetness):** 舌の先端で感じる残糖度を、辛口（Dry）から甘口（Sweet）まで評価します。\n*   **酸度 (Acidity):** 舌の側面や唾液の分泌量で酸のシャープさを測ります。寒冷な産地で高くなる傾向があります。\n*   **タンニン (Tannin):** 歯茎や口蓋の「渋み」「収斂性」として感じます。ブドウの果皮の厚さや木樽の使用を示します。\n*   **アルコールとボディ:** アルコールの熱感や、ワインの粘性（重さ）を「軽い」「中程度」「重い（フルボディ）」で捉えます。\n\n**風味と余韻:**\n鼻腔に抜ける香り（風味の特徴）と、ワインを飲み込んだ後（または吐き出した後）に心地よい風味が残る時間（余韻 / Finish）を計測します。",
        "summary_chars": 500
    },
    {
        "id": "wset_conclusion",
        "number": 104,
        "title": "WSET SAT - 結論 (Conclusion)",
        "title_en": "WSET SAT - Conclusion",
        "category": "PROFESSIONAL",
        "description": "テイスティングの最終段階。分析した全要素を統合し、BLIC（バランス、余韻、強さ、複雑性）に基づいて品質客観評価を下す。",
        "page_count": 1,
        "char_count": 500,
        "tier": "major",
        "key_points": [
            "品質評価 (Quality Level): BLIC基準による客観的採点",
            "BLIC: Balance, Length, Intensity, Complexity",
            "熟成ポテンシャル (Readiness for drinking): 飲み頃の判定"
        ],
        "keywords": ["Conclusion", "Quality", "Readiness for drinking", "BLIC", "Balance", "Length", "Intensity", "Complexity"],
        "summary": "### 結論：品質と熟成ポテンシャル\nこれまでの外観、香り、味わいの詳細な分析結果を統合し、ロジカルにワインの品質を最終評価します。\n\n**品質の客観評価基準 (BLIC):**\nWSETでは、個人の好みを排除し、以下の4要素（BLIC）がいくつ満たされているかで品質を判断します。\n*   **B (Balance):** 甘味・酸味・タンニン・アルコールが調和しているか。\n*   **L (Length):** 心地よい風味の余韻が長く続くか。\n*   **I (Intensity):** 香りや風味が明確で力強いか。\n*   **C (Complexity):** 第1、第2、第3アロマが入り混じる複雑性があるか。\n\n**熟成ポテンシャル:**\n現在の状態が「今が飲み頃か」「さらに熟成させるべきか」、あるいは「ピークを過ぎているか」を判断します。これにより、お客様に最適なタイミングでワインを提供するソムリエとしての責務を果たします。",
        "summary_chars": 500
    }
]

# Check if already added
existing_ids = [ch['id'] for ch in data['chapters']]
for card in wset_cards:
    if card['id'] not in existing_ids:
        data['chapters'].append(card)

# Update total
data['total_chapters'] = len(data['chapters'])

with open(INDEX_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Added WSET Logical Tasting cards to summary_index.json")
