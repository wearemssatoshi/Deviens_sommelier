#!/usr/bin/env python3
"""
Ingest 2025 Update PDFs into SommelierPRO Data structure without breaking existing KB.
"""

import os
import json
import re
from datetime import datetime
import pdfplumber

INPUT_DIR = "/Users/satoshiiga/dotfiles/SommelierPRO/Sommelier_add"
OUTPUT_DIR = "/Users/satoshiiga/dotfiles/SommelierPRO/data/chapters"
INDEX_PATH = "/Users/satoshiiga/dotfiles/SommelierPRO/data/chapter_index.json"

# Chapter definition template for new updates
UPDATE_CONFIG = {
    "japan": {"title": "日本 (2025)", "title_en": "Japan 2025", "icon": "🇯🇵", "category": "UPDATE_2025"},
    "usa": {"title": "アメリカ (2025)", "title_en": "USA 2025", "icon": "🇺🇸", "category": "UPDATE_2025"},
    "argentina": {"title": "アルゼンチン (2025)", "title_en": "Argentina 2025", "icon": "🇦🇷", "category": "UPDATE_2025"},
    "italy": {"title": "イタリア (2025)", "title_en": "Italy 2025", "icon": "🇮🇹", "category": "UPDATE_2025"},
    "greece": {"title": "ギリシャ (2025)", "title_en": "Greece 2025", "icon": "🇬🇷", "category": "UPDATE_2025"},
    "switzerland": {"title": "スイス (2025)", "title_en": "Switzerland 2025", "icon": "🇨🇭", "category": "UPDATE_2025"},
    "spain": {"title": "スペイン (2025)", "title_en": "Spain 2025", "icon": "🇪🇸", "category": "UPDATE_2025"},
    "germany": {"title": "ドイツ (2025)", "title_en": "Germany 2025", "icon": "🇩🇪", "category": "UPDATE_2025"},
    "chile": {"title": "チリ (2025)", "title_en": "Chile 2025", "icon": "🇨🇱", "category": "UPDATE_2025"},
    "france": {"title": "フランス (2025)", "title_en": "France 2025", "icon": "🇫🇷", "category": "UPDATE_2025"},
    "sa": {"title": "南アフリカ (2025)", "title_en": "South Africa 2025", "icon": "🇿🇦", "category": "UPDATE_2025"},
    "tasting": {"title": "テイスティング (2025)", "title_en": "Tasting 2025", "icon": "👃", "category": "UPDATE_2025"},
    "management": {"title": "マネジメント (2025)", "title_en": "Management 2025", "icon": "📦", "category": "UPDATE_2025"}
}

def clean_ocr(text):
    if not text: return ""
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def process_pdfs():
    print("Listing PDFs...")
    files = [f for f in os.listdir(INPUT_DIR) if f.endswith('.pdf')]
    # map by region
    # format: 1_2025japan1.pdf
    groups = {}
    for f in files:
        m = re.search(r'2025([a-zA-Z]+)\d*\.pdf', f)
        if m:
            region = m.group(1).lower()
            if region not in groups:
                groups[region] = []
            groups[region].append(f)
        else:
            print(f"Skipping {f} - unknown format")

    # sort files inside groups by prefix number
    for region in groups:
        groups[region].sort(key=lambda x: int(x.split('_')[0]) if '_' in x else 99)

    print(f"Found regions: {list(groups.keys())}")

    # Generate JSON chapters
    # We will start ID from ch26
    start_num = 26
    for region, file_list in groups.items():
        if region not in UPDATE_CONFIG:
            print(f"Warning: No config for {region}. Skipping.")
            continue
            
        print(f"\nProcessing region [{region}] -> {len(file_list)} files")
        
        ch_id = f"ch{start_num}_2025_{region}"
        ch_conf = UPDATE_CONFIG[region]
        
        all_pages = []
        global_page_num = 1
        
        for file in file_list:
            pdf_path = os.path.join(INPUT_DIR, file)
            print(f"  - Reading {file}...")
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    text = clean_ocr(text)
                    if len(text) > 20: # minor noise skip
                        all_pages.append({
                            "page": global_page_num,
                            "text": text,
                            "chars": len(text)
                        })
                        global_page_num += 1
                        
        total_chars = sum(p['chars'] for p in all_pages)
        ch_data = {
            "id": ch_id,
            "number": start_num,
            "title": ch_conf["title"],
            "title_en": ch_conf["title_en"],
            "category": ch_conf["category"],
            "icon": ch_conf["icon"],
            "description": "2025年度 J.S.A. 教本アップデート情報",
            "source_pages": [p['page'] for p in all_pages],
            "page_count": len(all_pages),
            "char_count": total_chars,
            "created_at": datetime.now().isoformat(),
            "version": "1.0",
            "pages": all_pages
        }
        
        out_file = os.path.join(OUTPUT_DIR, f"{ch_id}.json")
        with open(out_file, 'w', encoding='utf-8') as out_f:
            json.dump(ch_data, out_f, ensure_ascii=False, indent=2)
            
        print(f"  Saved {ch_id}.json ({len(all_pages)} pages, {total_chars} chars)")
        start_num += 1

if __name__ == '__main__':
    process_pdfs()
