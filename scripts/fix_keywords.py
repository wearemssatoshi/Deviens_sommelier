import json
import os
import time
from google import genai

API_KEY = os.environ.get('GEMINI_API_KEY')
client = genai.Client(api_key=API_KEY)

def run():
    dir_path = os.path.join(os.path.dirname(__file__), '../data/summaries')
    files = sorted([f for f in os.listdir(dir_path) if f.startswith('ch') and f.endswith('.json')])
    
    # We will skip France because it's already perfect (40 keywords)
    cnt = 0
    for filename in files:
        if filename == 'ch05_france.json':
            continue
            
        summary_path = os.path.join(dir_path, filename)
        with open(summary_path, 'r', encoding='utf-8') as f:
            summary = json.load(f)
            
        print(f"Fixing keywords for {filename}...")
        
        # Build context
        title = summary.get('title', '')
        desc = summary.get('description', '')
        text_context = summary.get('summary', '')
        key_points = summary.get('key_points', [])
        deep = summary.get('deep_content', {})
        
        prompt = f"""
あなたはソムリエ試験のプロフェッショナルなエデュケーターです。
以下のチャプターの内容から、このチャプターに特有で重要な「キーワード（単語）」を10〜20個抽出してください。
※関係のない一般的なワインターム（無関係なフランスの地名や品種など）は絶対に含めないでください！必ずこのチャプター（{title}）に直結するものだけを選んでください。

チャプター名: {title} ({desc})
重要ポイント: {key_points}
要約: {text_context[:1000]}
詳細: {json.dumps(deep, ensure_ascii=False)[:1000]}

出力フォーマット（必ずJSON配列のみを出力）:
["キーワード1", "キーワード2", "キーワード3", ...]
"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    model='gemini-2.5-flash', # flash is fine for keyword extraction
                    contents=prompt
                )
                out_text = response.text
                if out_text.startswith("```json"):
                    out_text = out_text[7:]
                elif out_text.startswith("```"):
                    out_text = out_text[3:]
                if out_text.endswith("```"):
                    out_text = out_text[:-3]
                
                kw = json.loads(out_text.strip())
                summary['keywords'] = kw
                
                with open(summary_path, 'w', encoding='utf-8') as f:
                    json.dump(summary, f, indent=2, ensure_ascii=False)
                
                print(f" -> Success! {len(kw)} keywords found.")
                break
            except Exception as e:
                print(f" -> Error (Attempt {attempt+1}):", e)
                time.sleep(5)
                
        time.sleep(2)
        cnt += 1
        
    print(f"Finished fixing keywords for {cnt} chapters.")

if __name__ == '__main__':
    run()
