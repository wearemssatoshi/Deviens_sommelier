#!/usr/bin/env python3
import json
import os
import sys
from google import genai
from google.genai import types

CHAPTER_FILE = "/Users/satoshiiga/dotfiles/SommelierPRO/data/chapters/ch26_latest_update.json"
SUMMARIES_DIR = "/Users/satoshiiga/dotfiles/SommelierPRO/data/summaries"

def main():
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        print("ERROR: GEMINI_API_KEY not set")
        sys.exit(1)
        
    client = genai.Client(api_key=api_key)
    
    with open(CHAPTER_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    full_text = "\n\n".join(p["text"] for p in data["pages"])
    # If it's too huge, we might just sample the first 100k chars to avoid limits
    if len(full_text) > 100000:
        full_text = full_text[:100000] + "\n\n... (略) ..."
    
    prompt = f"""
あなたは、「SAPPORO VIEWTIFUL DINING (SVD)」でトップソムリエとして活躍するプロフェッショナルです。
以下のテキストは、2025年度の最新のワインナレッジのアップデート情報です。

アプリのダッシュボードに表示する「最新アップデート」モジュールのためのサマリーを作成してください。

【厳格なルール】
1. ただの要約ではなく、現場のソムリエが「今年のトレンドと重要な変更点はこれだ」と語るような、**熱量と品格のある文体**にすること。
2. 「AI臭さ」を完全に排除すること。
   ❌禁止表現：「さらに」「しかし」「～であることが重要です」「～について解説します」「本チャプターでは」「～が挙げられます」
3. 即座に核心を突くこと。ダサい前置きは不要。
4. Markdown形式で、見出し（###）と箇条書きを適切に使い、美しくフォーマットすること。
5. あなたは自身で生成した文章を**5回**自己批判（ダメ出し）し、その度に書き直してください。最終的に出力するのは「5回叩き直した究極の完成版サマリー（Markdown）」および「Key Points（箇条書き3〜5点、文字列配列）」のみです。

出力は必ず以下のJSONスキーマに従ってください:
```json
{{
  "key_points": ["ポイント1", "ポイント2", "ポイント3"],
  "summary": "### 2025年 世界のワイントレンド\n\nここに洗練されたサマリー本文..."
}}
```

【元テキストの一部】
{full_text}
"""

    print("Generating AI Summary with 5-loop Reflection...")
    response = client.models.generate_content(
        model='gemini-2.5-pro',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.7,
        ),
    )
    
    try:
        res_json = json.loads(response.text)
        summary = res_json.get("summary", "")
        key_points = res_json.get("key_points", [])
    except Exception as e:
        print("Failed to parse JSON:", e)
        print(response.text)
        sys.exit(1)
        
    summary_data = {
        'id': data['id'],
        'number': data['number'],
        'title': data['title'],
        'title_en': data['title_en'],
        'category': data['category'],
        'icon': data['icon'],
        'description': data['description'],
        'page_count': data['page_count'],
        'char_count': data['char_count'],
        'tier': 'major',
        'key_points': key_points,
        'keywords': ["2025トレンド", "気候変動", "サステナビリティ", "A.O.C.更新", "醸造技術", "新品種"],
        'summary': summary,
        'summary_chars': len(summary),
    }
    
    out_path = os.path.join(SUMMARIES_DIR, f"{data['id']}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, ensure_ascii=False, indent=2)
        
    print(f"Summary generated and saved. Length: {len(summary)} chars.")

if __name__ == '__main__':
    main()
