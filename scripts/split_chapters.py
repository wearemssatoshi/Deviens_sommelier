#!/usr/bin/env python3
"""
ソムリエPRO — Chapter Splitter
修正済みOCRデータを独自チャプター構成（世界地図ベース）に分割する。
"""

import json
import os
from datetime import datetime

# === 入力 ===
INPUT_PATH = "/Users/satoshiiga/dotfiles/Sommelier/ocr_output/sommelier_textbook_2025_corrected.json"
OUTPUT_DIR = "/Users/satoshiiga/dotfiles/SommelierPRO/data/chapters"
WSET_DIR = "/Users/satoshiiga/dotfiles/SommelierPRO/data/wset"

# === 独自チャプター構成（SATビジョン：世界地図ベース）===
CHAPTERS = [
    # FOUNDATION
    {
        "id": "ch00_wine_overview",
        "number": 0,
        "title": "ワイン概論",
        "title_en": "Wine Overview",
        "category": "FOUNDATION",
        "icon": "🍇",
        "source_ranges": [(3, 36)],
        "description": "ワインの歴史、ブドウ栽培、醸造法の基礎"
    },
    {
        "id": "ch01_spirits_overview",
        "number": 1,
        "title": "酒類飲料概論",
        "title_en": "Spirits & Beverages Overview",
        "category": "FOUNDATION",
        "icon": "🥃",
        "source_ranges": [(37, 75)],
        "description": "日本酒、ビール、ウイスキー、ブランデー、スピリッツ、リキュール"
    },
    {
        "id": "ch02_beverages_overview",
        "number": 2,
        "title": "飲料概論",
        "title_en": "Non-Alcoholic Beverages",
        "category": "FOUNDATION",
        "icon": "☕",
        "source_ranges": [(76, 85)],
        "description": "ミネラルウォーター、コーヒー、紅茶、日本茶"
    },
    # ASIA & OCEANIA
    {
        "id": "ch03_japan",
        "number": 3,
        "title": "日本",
        "title_en": "Japan",
        "category": "ASIA_OCEANIA",
        "icon": "🇯🇵",
        "source_ranges": [(86, 131)],
        "description": "日本ワインの歴史、主要産地、品種、GI制度"
    },
    {
        "id": "ch04_australia_nz",
        "number": 4,
        "title": "オーストラリア & ニュージーランド",
        "title_en": "Australia & New Zealand",
        "category": "ASIA_OCEANIA",
        "icon": "🇦🇺",
        "source_ranges": [(278, 306), (496, 511)],
        "description": "オーストラリアとニュージーランドのワイン産業"
    },
    # EUROPE — 大国
    {
        "id": "ch05_france",
        "number": 5,
        "title": "フランス",
        "title_en": "France",
        "category": "EUROPE_MAJOR",
        "icon": "🇫🇷",
        "source_ranges": [(540, 660)],
        "description": "ボルドー、ブルゴーニュ、シャンパーニュ、ローヌ、ロワール、アルザス等"
    },
    {
        "id": "ch06_italy",
        "number": 6,
        "title": "イタリア",
        "title_en": "Italy",
        "category": "EUROPE_MAJOR",
        "icon": "🇮🇹",
        "source_ranges": [(195, 260)],
        "description": "ピエモンテ、トスカーナ、ヴェネト、シチリア等"
    },
    {
        "id": "ch07_spain",
        "number": 7,
        "title": "スペイン",
        "title_en": "Spain",
        "category": "EUROPE_MAJOR",
        "icon": "🇪🇸",
        "source_ranges": [(402, 440)],
        "description": "リオハ、リベラ・デル・ドゥエロ、カバ、シェリー等"
    },
    {
        "id": "ch08_germany",
        "number": 8,
        "title": "ドイツ",
        "title_en": "Germany",
        "category": "EUROPE_MAJOR",
        "icon": "🇩🇪",
        "source_ranges": [(463, 495)],
        "description": "モーゼル、ラインガウ、ファルツ、リースリング"
    },
    {
        "id": "ch09_portugal",
        "number": 9,
        "title": "ポルトガル",
        "title_en": "Portugal",
        "category": "EUROPE_MAJOR",
        "icon": "🇵🇹",
        "source_ranges": [(669, 691)],
        "description": "ポート、マデイラ、ヴィーニョ・ヴェルデ、ドウロ"
    },
    # AMERICAS
    {
        "id": "ch10_usa",
        "number": 10,
        "title": "アメリカ",
        "title_en": "United States of America",
        "category": "AMERICAS",
        "icon": "🇺🇸",
        "source_ranges": [(132, 183)],
        "description": "カリフォルニア、オレゴン、ワシントン、ナパ・ヴァレー"
    },
    {
        "id": "ch11_chile",
        "number": 11,
        "title": "チリ",
        "title_en": "Chile",
        "category": "AMERICAS",
        "icon": "🇨🇱",
        "source_ranges": [(446, 462)],
        "description": "セントラル・ヴァレー、カサブランカ、カルメネール"
    },
    {
        "id": "ch12_south_america",
        "number": 12,
        "title": "アルゼンチン & 南米",
        "title_en": "Argentina & South America",
        "category": "AMERICAS",
        "icon": "🇦🇷",
        "source_ranges": [(184, 194), (261, 267)],
        "description": "アルゼンチン（メンドーサ、マルベック）、ウルグアイ（タナ）"
    },
    {
        "id": "ch13_canada",
        "number": 13,
        "title": "カナダ",
        "title_en": "Canada",
        "category": "AMERICAS",
        "icon": "🇨🇦",
        "source_ranges": [(332, 348)],
        "description": "アイスワイン、オンタリオ、ブリティッシュ・コロンビア"
    },
    # EUROPE — 小国・新興
    {
        "id": "ch14_austria",
        "number": 14,
        "title": "オーストリア",
        "title_en": "Austria",
        "category": "EUROPE_MINOR",
        "icon": "🇦🇹",
        "source_ranges": [(307, 331)],
        "description": "グリューナー・ヴェルトリーナー、ヴァッハウ"
    },
    {
        "id": "ch15_hungary",
        "number": 15,
        "title": "ハンガリー",
        "title_en": "Hungary",
        "category": "EUROPE_MINOR",
        "icon": "🇭🇺",
        "source_ranges": [(512, 539)],
        "description": "トカイ（貴腐ワイン）、エゲル（ビカヴェール）"
    },
    {
        "id": "ch16_central_eastern_europe",
        "number": 16,
        "title": "中欧・東欧",
        "title_en": "Central & Eastern Europe",
        "category": "EUROPE_MINOR",
        "icon": "🌍",
        "source_ranges": [(441, 445), (367, 374), (661, 668), (709, 713), (704, 708), (714, 717)],
        "description": "スロヴェニア、クロアチア、ブルガリア、ルーマニア、モルドバ、ルクセンブルク"
    },
    {
        "id": "ch17_greece_georgia",
        "number": 17,
        "title": "ギリシャ & ジョージア",
        "title_en": "Greece & Georgia",
        "category": "EUROPE_MINOR",
        "icon": "🇬🇷",
        "source_ranges": [(349, 366), (375, 387)],
        "description": "ワイン発祥の地。クヴェヴリ醸造、レツィーナ"
    },
    {
        "id": "ch18_switzerland_uk",
        "number": 18,
        "title": "スイス & 英国",
        "title_en": "Switzerland & United Kingdom",
        "category": "EUROPE_MINOR",
        "icon": "🇨🇭",
        "source_ranges": [(388, 401), (268, 277)],
        "description": "スイスのシャスラ、英国のスパークリングワイン"
    },
    # AFRICA
    {
        "id": "ch19_south_africa",
        "number": 19,
        "title": "南アフリカ",
        "title_en": "South Africa",
        "category": "AFRICA",
        "icon": "🇿🇦",
        "source_ranges": [(692, 703)],
        "description": "ステレンボッシュ、ピノタージュ、ケープ・ワインランド"
    },
    # PROFESSIONAL
    {
        "id": "ch20_tasting",
        "number": 20,
        "title": "テイスティング",
        "title_en": "Wine Tasting",
        "category": "PROFESSIONAL",
        "icon": "👃",
        "source_ranges": [(718, 728)],
        "description": "テイスティング技法、外観・香り・味わいの評価"
    },
    {
        "id": "ch21_cheese",
        "number": 21,
        "title": "チーズ",
        "title_en": "Cheese",
        "category": "PROFESSIONAL",
        "icon": "🧀",
        "source_ranges": [(729, 747)],
        "description": "チーズの分類、製法、ワインとの組み合わせ"
    },
    {
        "id": "ch22_pairing",
        "number": 22,
        "title": "料理とワインの相性",
        "title_en": "Food & Wine Pairing",
        "category": "PROFESSIONAL",
        "icon": "🍽️",
        "source_ranges": [(748, 753)],
        "description": "ペアリングの基本原則、相性の科学"
    },
    {
        "id": "ch23_wine_management",
        "number": 23,
        "title": "ワインの購入・保管・熟成・販売",
        "title_en": "Wine Management",
        "category": "PROFESSIONAL",
        "icon": "📦",
        "source_ranges": [(754, 770)],
        "description": "ワインの購入、保管条件、セラー管理、販売"
    },
    {
        "id": "ch24_sommelier",
        "number": 24,
        "title": "ソムリエの職責とサービス実技",
        "title_en": "Sommelier Duties & Service",
        "category": "PROFESSIONAL",
        "icon": "🎩",
        "source_ranges": [(771, 783)],
        "description": "ソムリエの役割、サービス手順、デキャンタージュ"
    },
    {
        "id": "ch25_jsa_exam",
        "number": 25,
        "title": "J.S.A.呼称資格認定試験",
        "title_en": "J.S.A. Certification Exam",
        "category": "PROFESSIONAL",
        "icon": "📝",
        "source_ranges": [(784, 790)],
        "description": "試験概要、出題傾向、合格基準"
    },
]

def main():
    # Load corrected data
    with open(INPUT_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    pages_by_num = {p['page']: p for p in data['pages']}
    
    chapter_index = []
    total_chapters = 0
    total_pages = 0
    total_chars = 0
    
    for ch in CHAPTERS:
        # Collect pages for this chapter
        ch_pages = []
        for start, end in ch['source_ranges']:
            for page_num in range(start, end + 1):
                if page_num in pages_by_num:
                    ch_pages.append(pages_by_num[page_num])
        
        # Sort by page number
        ch_pages.sort(key=lambda p: p['page'])
        
        ch_chars = sum(p['chars'] for p in ch_pages)
        
        # Build chapter JSON
        chapter_data = {
            "id": ch['id'],
            "number": ch['number'],
            "title": ch['title'],
            "title_en": ch['title_en'],
            "category": ch['category'],
            "icon": ch['icon'],
            "description": ch['description'],
            "source_pages": [p['page'] for p in ch_pages],
            "page_count": len(ch_pages),
            "char_count": ch_chars,
            "created_at": datetime.now().isoformat(),
            "version": "1.0",
            "pages": ch_pages
        }
        
        # Save chapter file
        output_path = os.path.join(OUTPUT_DIR, f"{ch['id']}.json")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(chapter_data, f, ensure_ascii=False, indent=2)
        
        # Index entry
        chapter_index.append({
            "id": ch['id'],
            "number": ch['number'],
            "title": ch['title'],
            "title_en": ch['title_en'],
            "category": ch['category'],
            "icon": ch['icon'],
            "description": ch['description'],
            "page_count": len(ch_pages),
            "char_count": ch_chars,
            "file": f"chapters/{ch['id']}.json"
        })
        
        total_chapters += 1
        total_pages += len(ch_pages)
        total_chars += ch_chars
        
        status = "✅" if ch_chars > 0 else "⚠️"
        print(f"{status} {ch['icon']} {ch['id']:35s} | {len(ch_pages):3d}p | {ch_chars:7,}文字")
    
    # Save chapter index
    index_data = {
        "project": "ソムリエPRO",
        "version": "1.0",
        "created_at": datetime.now().isoformat(),
        "total_chapters": total_chapters,
        "total_pages": total_pages,
        "total_chars": total_chars,
        "categories": [
            {"id": "FOUNDATION", "title": "基礎概論", "icon": "📚"},
            {"id": "ASIA_OCEANIA", "title": "アジア & オセアニア", "icon": "🌏"},
            {"id": "EUROPE_MAJOR", "title": "ヨーロッパ大国", "icon": "🏰"},
            {"id": "AMERICAS", "title": "アメリカ大陸", "icon": "🌎"},
            {"id": "EUROPE_MINOR", "title": "ヨーロッパ小国・新興", "icon": "🗺️"},
            {"id": "AFRICA", "title": "アフリカ", "icon": "🌍"},
            {"id": "PROFESSIONAL", "title": "プロフェッショナル", "icon": "🎓"},
        ],
        "chapters": chapter_index
    }
    
    index_path = os.path.join(os.path.dirname(OUTPUT_DIR), "chapter_index.json")
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"📊 合計: {total_chapters}章 | {total_pages}ページ | {total_chars:,}文字")
    print(f"📁 インデックス: {index_path}")
    print(f"✅ 完了!")

if __name__ == "__main__":
    main()
