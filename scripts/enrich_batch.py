import json
import os
import time
from google import genai

API_KEY = os.environ.get('GEMINI_API_KEY')
if not API_KEY:
    print("Error: GEMINI_API_KEY not found.")
    exit(1)

client = genai.Client(api_key=API_KEY)

TARGET_CHAPTERS = [
    'ch00_wine_overview',
    'ch01_spirits_overview',
    'ch02_beverages_overview',
    'ch03_japan',
    'ch04_australia_nz'
]

def get_raw_text(chapter_id):
    path = os.path.join(os.path.dirname(__file__), f'../data/chapters/{chapter_id}.json')
    if not os.path.exists(path):
        return None
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    text = ""
    for page in data.get('pages', []):
        text += page.get('text', '') + "\n"
    return text

def get_summary_json(chapter_id):
    path = os.path.join(os.path.dirname(__file__), f'../data/summaries/{chapter_id}.json')
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def run():
    for chapter_id in TARGET_CHAPTERS:
        print(f"--- Processing {chapter_id} ---")
        summary = get_summary_json(chapter_id)
        
        if 'deep_content' in summary and summary['deep_content']:
            print(f"Skipping {chapter_id}, deep_content already exists.")
            continue
            
        text = get_raw_text(chapter_id)
        if not text:
            print(f"Raw OCR text for {chapter_id} not found!")
            continue

        prompt = f"""
あなたはソムリエ試験のプロフェッショナルなエデュケーターです。
以下のワイン教本チャプターのフルテキスト（OCR抽出データ）を緻密に分析し、
試験に出る本質的な情報を抽出して、以下のJSON形式で出力してください。

捏造は絶対にせず、テキストにある事実のみをベースにしてください。
「exam_tips」には、試験対策として最重要な10〜15個のポイントを記載してください。
「classification_tables」には、表のタイトルをキーとして、各要素（カンマ区切りまたは「|」区切りなど）の配列で整理してください（最大3-4テーブル）。
「timeline」には、歴史の重要な年号と出来事を時系列で5〜10個抽出してください（該当がない場合は空配列で構いません）。

出力フォーマット（JSON）:
{{
  "exam_tips": ["...", "..."],
  "classification_tables": {{
    "table_key1": ["item1", "item2"],
    "table_key2": ["item1", "item2"]
  }},
  "timeline": [
    {{"year": "年号", "event": "出来事"}},
    {{"year": "年号", "event": "出来事"}}
  ]
}}

### Raw OCR Text:
{text}
"""
        
        print("Calling Gemini API...")
        try:
            response = client.models.generate_content(
                model='gemini-2.5-pro',
                contents=prompt
            )
            out_text = response.text
            if out_text.startswith("```json"):
                out_text = out_text[7:]
            elif out_text.startswith("```"):
                out_text = out_text[3:]
            if out_text.endswith("```"):
                out_text = out_text[:-3]
            
            new_data = json.loads(out_text.strip())
            summary['deep_content'] = new_data
            
            path = os.path.join(os.path.dirname(__file__), f'../data/summaries/{chapter_id}.json')
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(summary, f, indent=2, ensure_ascii=False)
            print(f"Success! Updated {chapter_id}.")
        except Exception as e:
            print(f"Error parsing JSON for {chapter_id}:", e)
            print("Raw output:", response.text)
        
        # Rate limit pause just in case
        time.sleep(5)

if __name__ == '__main__':
    run()
