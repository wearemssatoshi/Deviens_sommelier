# -*- coding: utf-8 -*-
import json

INDEX_PATH = '/Users/satoshiiga/dotfiles/SommelierPRO/data/summaries/summary_index.json'

with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Remove the 4 split wset cards if they exist
data['chapters'] = [ch for ch in data['chapters'] if not ch['id'].startswith('wset_')]

# The new combined WSET SAT card
wset_sat_card = {
    "id": "wset_sat",
    "number": 100,
    "title": "WSET SAT - ロジカルテイスティング",
    "title_en": "WSET Systematic Approach to Tasting",
    "category": "W-SAT-SET",
    "description": "WSETが提唱するSystematic Approach to Tasting (SAT)の全ステップ。外観、香り、味わい、そして品質評価（BLIC）に至るまでのプロファイリング手法を一枚のカードに網羅。",
    "page_count": 1,
    "char_count": 1500,
    "tier": "major",
    "icon": "🍷",
    "key_points": [
        "テイスティングを直感ではなく4段階で構造化する",
        "外観、香り、味わいからワインの過去と現在を推測",
        "個人の好みを排除したBLIC基準での客観的品質評価",
        "テロワール、醸造手法、熟成ポテンシャルを特定する"
    ],
    "keywords": ["WSET", "SAT", "Appearance", "Nose", "Palate", "Conclusion", "BLIC"],
    "summary": "### The Systematic Approach to Tasting (SAT)\n\nWSETのテイスティングは、ワインを直感や好みではなく、体系的なロジックで分解するプロフェッショナルなスキルである。以下の表は、各ステップでの分析項目とその目的を構造化したものである。\n\n| ステップ | 分析項目 | 目的と着眼点 |\n| :--- | :--- | :--- |\n| **1. 外観 (Appearance)** | 透明度、色調（Colour）、濃淡（Intensity）、粘性（Tears/Legs） | **「ワインの素性を暴くファーストコンタクト」**<br>白い背景にグラスを45度傾ける。レモンからアンバー、パープルからトーニーへの退色で熟成度を図る。真上からステムが見えるかで果皮の厚さや気候を推測し、粘性からアルコールや残糖度を予測する。 |\n| **2. 香り (Nose)** | 健全度（Condition）、強さ（Intensity）、香りの特徴（Aroma） | **「香りの地層から歴史を掘り起こす」**<br>ブショネ（TCA）などマイナス要素がないかフラットに確認する。第1アロマでブドウ本来の果実味と産地の気候を読み、第2アロマで樽やMLFなど醸造家の意図を探る。第3アロマで時間のみが作れる熟成のブーケを探り当てる。 |\n| **3. 味わい (Palate)** | 甘味、酸度、タンニン、アルコール（ボディ）、風味、余韻（Finish） | **「グラスの中の骨格（ストラクチャー）を丸裸にする」**<br>舌の先端で残糖を、側面で酸のキレを、歯茎でタンニンの収斂性を精密に測る。喉元でアルコールのボリュームを感じ、飲み込んだ後に鼻腔へ抜ける余韻の長さを計測する。ここでワインの世界観が決定づけられる。 |\n| **4. 結論 (Conclusion)** | 品質評価（Quality Level）、熟成ポテンシャル | **「個人の好みを排除したシビアな判定」**<br>収集したデータを統合し、客観的品質基準である「**BLIC**」（Balance, Length, Intensity, Complexity）のピースがどれだけ揃っているかで品質を採点する。同時に、今が最適な飲み頃か、さらに熟成させるべきかを断定する。 |\n\n> 💡 **ソムリエとしての責務**\n> 最終段階の「結論」によって導き出された客観的評価は、お客様に最高のタイミングと表現でワインを届けるための唯一無二の羅針盤となる。",
    "summary_chars": 1200
}

data['chapters'].append(wset_sat_card)

# Update total
data['total_chapters'] = len(data['chapters'])

with open(INDEX_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Combined WSET SAT card created and saved.")
