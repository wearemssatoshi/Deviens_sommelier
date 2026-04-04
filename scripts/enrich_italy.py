import json
import os
from google import genai
from pydantic import BaseModel
from typing import List, Dict, Optional

API_KEY = os.environ.get('GEMINI_API_KEY')

def get_italy_raw_text():
    path = os.path.join(os.path.dirname(__file__), '../data/chapters/ch06_italy.json')
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    text = ""
    for page in data.get('pages', []):
        text += page.get('text', '') + "\n"
    return text

def get_summary_json():
    path = os.path.join(os.path.dirname(__file__), '../data/summaries/ch06_italy.json')
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def run():
    client = genai.Client(api_key=API_KEY)
    text = get_italy_raw_text()
    
    prompt = f"""
あなたはソムリエ試験のプロフェッショナルなエデュケーターです。
以下のイタリアワインのフルテキスト（OCR抽出されたソムリエ教本約13万文字）を緻密に分析し、
試験に出る本質的な情報を抽出して、以下のJSON形式で出力してください。

捏造は絶対にせず、テキストにある事実のみをベースにしてください。
「exam_tips」には、試験対策として最重要な10〜15個のポイントを記載してください。
「classification_tables」には、イタリアワインの重要なD.O.C.G.や格付け、州ごとの重要品種などの表形式データを整理してください（最大3-4カテゴリ）。
「timeline」には、イタリアワインの歴史の重要な年号と出来事を時系列で5〜10個抽出してください。

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

### Italy Raw Text
{text}
"""
    
    print("Calling Gemini API with gemini-2.5-pro...")
    response = client.models.generate_content(
        model='gemini-2.5-pro',
        contents=prompt
    )
    
    out_text = response.text
    if out_text.startswith("```json"):
        out_text = out_text[7:]
    if out_text.endswith("```"):
        out_text = out_text[:-3]
    
    try:
        new_data = json.loads(out_text.strip())
        summary = get_summary_json()
        summary['deep_content'] = new_data
        
        path = os.path.join(os.path.dirname(__file__), '../data/summaries/ch06_italy.json')
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        print("Success! Updated summarizing json for Italy.")
    except Exception as e:
        print("Error parsing JSON:")
        print(e)
        print("Raw output:", response.text)

if __name__ == '__main__':
    run()
