import json
import os
import time
from google import genai

API_KEY = os.environ.get('GEMINI_API_KEY')
FILE_PATH = os.path.join(os.path.dirname(__file__), '../data/summaries/summary_index.json')

def rewrite_summary_with_gemini(client, chapter_title, messy_text, key_points):
    prompt = f"""
あなたはソムリエ試験のプロフェッショナルな編集者です。
以下のワイン教本チャプターのテキスト（OCR抽出のためゴミ文字や誤字が含まれています）と重要なキーワードを元に、
学習者が読みやすい美しい日本語の要約文を作成してください。

ターゲットチャプター: {chapter_title}

重要ポイント（全体の構成の軸として必ず盛り込む）:
{chr(10).join(f"- {kp}" for kp in key_points)}

====
元のOCRテキスト抜粋（参考用。ノイズは無視してください）:
{messy_text[:1500]}
====

要件：
- 400〜600文字程度の美しい日本語文章にすること
- いくつかの論点に分け、それぞれ `### [見出し名]` というマークダウン見出しをつけること
- \n\n を適切に使用して読みやすく段落分けすること
- OCRのゴミ文字や意味不明な記号、文末の不自然な切れ端は全て排除すること。完全な文にすること。
- プレミアムなプラットフォームにふさわしい、洗練された「である・だ」調の断定形でまとめること
- 回答は要約テキストのMarkdownのみを出力してください（最初の挨拶などは不要）
"""
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text.strip()
    except Exception as e:
        print(f"Error for {chapter_title}: {e}")
        return messy_text # fallback

def main():
    if not API_KEY:
        print("GEMINI_API_KEY environment variable is missing.")
        return

    client = genai.Client(api_key=API_KEY)

    with open(FILE_PATH, 'r', encoding='utf-8') as f:
        index_data = json.load(f)

    for ch in index_data['chapters']:
        print(f"Processing: {ch['title']}...")
        clean_text = rewrite_summary_with_gemini(client, ch['title'], ch['summary'], ch['key_points'])
        if clean_text != ch['summary']:
            ch['summary'] = clean_text
            ch['summary_chars'] = len(clean_text)
        time.sleep(2) # generous rate limit pause

    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

    for ch in index_data['chapters']:
        indiv_path = os.path.join(os.path.dirname(__file__), '../data/summaries', f"{ch['id']}.json")
        if os.path.exists(indiv_path):
            with open(indiv_path, 'w', encoding='utf-8') as f:
                json.dump(ch, f, ensure_ascii=False, indent=2)

    print("Successfully cleaned up all summaries.")

if __name__ == '__main__':
    main()
