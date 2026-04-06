import os
import json

dir_path = '/Users/satoshiiga/dotfiles/SommelierPRO/data/summaries'
files = sorted([f for f in os.listdir(dir_path) if f.startswith('ch') and f.endswith('.json')])

chapters = []
for f in files:
    with open(os.path.join(dir_path, f), 'r', encoding='utf-8') as file:
        data = json.load(file)
        chapters.append(data)

index_data = {"chapters": chapters}
with open(os.path.join(dir_path, 'summary_index.json'), 'w', encoding='utf-8') as out:
    json.dump(index_data, out, ensure_ascii=False, indent=2)

print("Rebuilt summary_index.json with", len(chapters), "chapters.")

# Ensure WSET cards are injected back
import subprocess
try:
    subprocess.run(['python3', os.path.join(os.path.dirname(__file__), 'add_wset_cards.py')], check=True)
except Exception as e:
    print("Warning: could not add WSET cards automatically:", e)
