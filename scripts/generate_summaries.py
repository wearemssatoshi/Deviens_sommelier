#!/usr/bin/env python3
"""
ソムリエPRO — チャプター概要まとめ生成 v3.0
キュレーション済みKey Points（全26章）+ 強化版OCRクリーンアップ
"""

import json
import re
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
CHAPTERS_DIR = os.path.join(DATA_DIR, 'chapters')
SUMMARIES_DIR = os.path.join(DATA_DIR, 'summaries')

# 大国系チャプター（5000文字目安）
MAJOR_CHAPTERS = {'ch05_france', 'ch06_italy', 'ch07_spain', 'ch08_germany',
                  'ch09_portugal', 'ch10_usa', 'ch00_wine_overview',
                  'ch01_spirits_overview', 'ch03_japan'}


# ========================================
# キュレーション済みKey Points（全26チャプター完備）
# 信頼性の高い一次情報に基づく正確な要約ポイント
# ========================================
CURATED_KEY_POINTS = {
    'ch00_wine_overview': [
        'ワインはブドウ果実を原料とした醸造酒で、糖化工程が不要',
        'アロマは第1（品種由来）、第2（発酵由来）、ブーケ（熟成由来）に分類',
        '酒石酸・リンゴ酸などの有機酸がワインの低pHと安定発酵を実現',
        'ヴィニフェラ種のブドウはコーカサス地方が原産地',
        'フィロキセラ禍が19世紀後半にヨーロッパのブドウ畑を壊滅',
        '赤ワインのタンニンは厚みと飲みごたえの重要な要素',
        'ワインは健康的な飲料としてポリフェノール等の効果が注目',
        'テロワール（気候・土壌・地形）がワインの個性を決定',
    ],
    'ch01_spirits_overview': [
        '日本酒は並行複発酵という独自の醸造技術で醸される',
        '清酒は米・米麹・水を主原料とし、濾過工程を経た酒',
        '日本酒は6〜60℃の幅広い飲用温度で楽しめる世界的に稀な酒',
        '一麹二酛三造り——麹づくりが酒質に最も影響する',
        '三段仕込み（初添・仲添・留添）で段階的に醸を仕込む',
        'ひやおろしは一夏寝かせた後、二度目の火入れをせず出荷',
        'テロワールが米・水の個性を通じて日本酒の多様性を生む',
        'ビールは単行複発酵、ワインは単発酵と醸造方法が異なる',
    ],
    'ch02_beverages_overview': [
        'ミネラルウォーターは4分類（ナチュラル・ナチュラルミネラル・ミネラル・ボトルド）',
        '日本は殺菌処理が前提だが、欧州では無処理が一般的',
        '日本茶は主に緑茶（不発酵茶）で、中国種が中心',
        '茶の分類は酵素失活の順序で決まる（緑茶＝最初、紅茶＝最後）',
        '煎茶が日本茶の標準的存在',
        '2023年のミネラルウォーター国民1人当たり消費量は40.2ℓ',
    ],
    'ch03_japan': [
        '日本ワインの生産量トップ3は山梨・長野・北海道',
        '南北約18度の緯度差——フランス全産地の3倍の幅を持つ多様性',
        '甲州・マスカット・ベーリーAなど固有品種が国際的に評価',
        'ヴィニフェラ種に加え、アメリカ系・東アジア系品種も使用',
        '2018年「果実酒等の製法品質表示基準」でラベル規制を整備',
        '日本ワインはワイン全体の流通量の4.4%',
        'ワイナリー数は453場（2023年）で増加傾向',
        'GI制度の導入により産地呼称の保護が進展',
    ],
    'ch04_australia_nz': [
        'オーストラリアの国土は欧州の約7割に匹敵する広大さ',
        '南緯31〜43度に帯状に分布する多様なワイン産地',
        '114ヵ所の地理的呼称（GI）が設定されている',
        'バロッサ・ヴァレーのシラーズが世界的に有名',
        '水資源の制約が低価格ワイン生産の課題',
        'ニュージーランドはマールボロのソーヴィニヨン・ブランが世界的評価',
    ],
    'ch05_france': [
        'ブドウ畑の総面積745,206ha、生産量約4,588万hℓ',
        'A.O.C.（原産地統制呼称）制度の発祥国',
        'ボルドー・ブルゴーニュ・シャンパーニュ・ローヌが4大銘醸地',
        'カベルネ・ソーヴィニヨン、ピノ・ノワール、シャルドネ、シラーが主要品種',
        '紀元前6世紀にフォカイア人がマルセイユにブドウ栽培を伝来',
        '19世紀後半のフィロキセラ禍がA.O.C.制度確立の契機に',
        '南仏は1980年代以降に品質が著しく進化',
        '有機栽培・環境配慮型農法が90年代以降に拡大',
    ],
    'ch06_italy': [
        '南北に長い国土と多様な地形・気候がワインの多様性を生む',
        '栽培面積661,811ha、生産量約4,250万hℓで世界トップ3',
        'D.O.C.G./D.O.C./I.G.T.の品質分類体系',
        'サンジョヴェーゼ（トスカーナ）、ネッビオーロ（ピエモンテ）が代表品種',
        '1970年代末〜の「イタリアワイン・ルネッサンス」で品質革新',
        'スーパータスカンがブラインド試飲でボルドー銘酒を凌駕',
        '古代ギリシャ人が「エノトリア・テルス（ワインの大地）」と称賛',
        '固有品種の再評価と伝統的醸造法の見直しが進行中',
    ],
    'ch07_spain': [
        'ブドウ栽培面積約928,108haで世界第1位',
        'テンプラニーリョが最も重要な黒ブドウ品種',
        'リオハ・リベラ デル ドゥエロ（スティル）、カバ（スパークリング）、シェリー（酒精強化）が代表',
        'D.O.P.は103（69D.O.、2D.O.Ca.等）が認定',
        '711年〜のムーア人支配期にも一部のブドウ栽培は継続',
        '1492年のレコンキスタ完了とアメリカ大陸発見が転機',
        '1986年のEC加盟以降、品質革新が加速',
        'カスティーリャ・ラ・マンチャ州が栽培面積・生産量ともに最大',
    ],
    'ch08_germany': [
        'EU最北のゾーンA（最も冷涼）に大半が位置',
        'リースリングとシュペートブルグンダー（ピノ・ノワール）が主要品種',
        '川沿いの急斜面を利用した伝統的ブドウ栽培',
        '18世紀のヨハニスベルクで貴腐ワイン醸造が始まる',
        '2000年代の「リースリング・ルネッサンス」で辛口評価が向上',
        'VDP.による畑の格付制度の導入',
        '気候変動によりシャルドネ等フランス系品種の栽培が増加',
        '格付基準が果汁糖度から地理的呼称範囲へ移行中',
    ],
    'ch09_portugal': [
        '250種超の固有品種数は1ha当たりで世界最多',
        'ポートとマデイラはシェリーと合わせ世界3大酒精強化ワイン',
        'トウリガ・ナショナル、トウリガ・フランカが代表的黒ブドウ',
        'アルヴァリーニョ（白）の国際的評価が上昇中',
        '1974年のカーネーション革命以降、品質が急速に向上',
        'サラザール独裁下の鎖国状態が固有品種の温存に寄与',
        '日本とは南蛮貿易以来の歴史的つながりを持つ',
        'ヴィーニョ・ヴェルデが代表的な微発泡白ワイン',
    ],
    'ch10_usa': [
        'カリフォルニア州が全生産量の約80%を占める',
        '1976年「パリスの審判」でカリフォルニアワインが世界に衝撃',
        '国内ワイン消費量は世界最大（約3,649万hℓ）',
        '1920〜1933年の禁酒法がワイン産業に壊滅的打撃',
        'ナパ・ヴァレーが最高品質の産地として国際的に認知',
        'オレゴン州のピノ・ノワール、ワシントン州の赤ワインが台頭',
        'AVA（認定栽培地域）制度で産地を管理',
        'コロナ後のネット販売・ダイレクトシップメントが急増',
    ],
    'ch11_chile': [
        'フィロキセラの被害を受けていない世界的にも稀な産地',
        'カルメネールがチリを代表する固有品種として再発見',
        '日本との経済連携協定で2019年から関税ゼロ',
        'アンデス山脈と太平洋に挟まれた理想的な栽培環境',
        '南緯27〜40度の1,400kmにブドウ栽培地域が分布',
        '16世紀のスペイン伝道師がパイス種を最初に植樹',
    ],
    'ch12_south_america': [
        'マルベックがアルゼンチンを代表する品種',
        'メンドーサ州が最大のワイン産地で全生産量の約75%',
        '標高800〜1,500mの高地栽培が世界的にユニーク',
        'アンデス山脈からの雪解け水が灌漑の生命線',
        '19世紀のヨーロッパ移民がワイン文化を持ち込んだ',
        'トロンテスが独自の白ブドウ品種として国際的に注目',
    ],
    'ch13_canada': [
        'アイスワインの世界最大の生産国',
        'オンタリオ州ナイアガラ半島とBC州オカナガンが二大産地',
        'ヴィダルとリースリングがアイスワインの主要品種',
        'VQA（Vintners Quality Alliance）が品質認証制度',
        '厳しい冬の寒さを活かした氷結収穫が特徴',
        'ピノ・ノワールとシャルドネのスティルワインも品質向上中',
    ],
    'ch14_austria': [
        'グリューナー・ヴェルトリーナーが最も重要な白ブドウ品種',
        'DAC（Districtus Austriae Controllatus）が原産地呼称制度',
        'ニーダーエスターライヒ州が最大の栽培面積',
        'ヴァッハウの急斜面テラス畑が世界遺産に登録',
        '1985年の不凍液混入スキャンダルが品質改革の契機に',
        'ツヴァイゲルトが最も栽培面積の多い赤品種',
    ],
    'ch15_hungary': [
        'トカイ・アスーは世界三大貴腐ワインのひとつ',
        'フルミントが最も重要な白ブドウ品種',
        'エゲル地方のエグリ・ビカヴェール（牡牛の血）が有名な赤ワイン',
        '22のワイン産地が指定されている',
        '社会主義体制崩壊後の民営化で品質が急速に向上',
        'ルイ14世がトカイを「王のワインにしてワインの王」と賞賛',
    ],
    'ch16_central_eastern_europe': [
        'チェコ、スロヴァキア、スロヴェニア、クロアチア等が主要生産国',
        'スロヴェニアはイタリアと隣接し長いワイン栽培の歴史',
        'クロアチアは固有品種が豊富でダルマチア沿岸が主要産地',
        'ルーマニアはフェテアスカ系の固有品種が特徴的',
        'ブルガリアはマヴルッドなど固有品種の再評価が進行',
        'モルドヴァはかつてソ連最大のワイン供給地',
    ],
    'ch17_greece_georgia': [
        'ギリシャは紀元前2000年からのワイン栽培の歴史',
        'アシルティコ（サントリーニ島）が代表的な白品種',
        'レツィーナ（松脂風味のワイン）がギリシャ独自の伝統',
        'ジョージアはワイン発祥の地（紀元前6000年）',
        'クヴェヴリ（陶器の甕）醸造がユネスコ無形文化遺産に登録',
        'サペラヴィとルカツィテリが代表品種',
    ],
    'ch18_switzerland_uk': [
        'スイスはシャスラ（ファンダン）が最も栽培面積の多い白品種',
        '生産量の99%が国内消費される希少性',
        'ヴァレー州が最大の産地で、テラス式ブドウ畑が特徴',
        'イングランドはスパークリングワインの品質が国際的に評価',
        'チューリッヒ・ジュネーヴなど湖畔の産地が多い',
        '英国のブドウ栽培は気候変動の追い風を受けて急拡大',
    ],
    'ch19_south_africa': [
        'ピノタージュ（ピノ・ノワール×サンソー）が固有品種',
        'ステレンボッシュが最も重要なワイン産地',
        '1990年代のアパルトヘイト解消後にワイン輸出が急拡大',
        'ケープタウン周辺の地中海性気候がブドウ栽培に好適',
        '「持続可能性認証」制度でサステナビリティをリード',
        'チェニン・ブランの栽培面積が世界最大',
    ],
    'ch20_tasting': [
        '外観・香り・味わいの3段階でワインを分析',
        '外観では色調・輝き・粘性を観察',
        '第1アロマ（品種由来）と第2アロマ（発酵・醸造由来）とブーケ（熟成由来）',
        '味わいは甘味・酸味・苦味・渋味・アルコール感のバランス',
        'テイスティングコメントの体系的な用語体系が存在',
        'ブラインドテイスティングが品種・産地の特定訓練に不可欠',
    ],
    'ch21_cheese': [
        'チーズはフレッシュ・白カビ・青カビ・ハード等に分類',
        'フランスのA.O.P.認定チーズは46種',
        'チーズとワインの相性は地域性の原則が基本',
        'チーズの熟成度合いに合わせてワインの熟成度を合わせる',
        '山羊チーズにはソーヴィニヨン・ブランが定番の組み合わせ',
        'ブルーチーズと甘口ワイン（ソーテルヌ等）は黄金の組み合わせ',
    ],
    'ch22_pairing': [
        '料理とワインの相性は「同調」と「補完」の2つの原則',
        '地方料理にはその地方のワインを合わせる地域性の原則',
        '食材の重さ（コク）とワインのボディを合わせるのが基本',
        '酸味のある料理には酸味のあるワインが好相性',
        'タンニンの強い赤ワインは脂肪分の多い肉料理と調和',
        'デザートにはデザートワイン以上の甘さが必要',
    ],
    'ch23_wine_management': [
        'ワインの適切な保管温度は12〜15℃が理想',
        '光・振動・乾燥がワインの劣化3大要因',
        '横置き保管でコルクの乾燥を防止',
        '飲み頃の判断は品種・ヴィンテージ・保管状態に依存',
        'レストランでのワイン管理はセラー温度と在庫回転がポイント',
        'ワインリストの構成は産地別・品種別・価格帯別が標準',
    ],
    'ch24_sommelier': [
        'ソムリエは飲料全般のサービスと管理を担う専門職',
        'デキャンタージュの判断と手技がサービスの見せ場',
        'ワインの温度管理（白は8〜12℃、赤は16〜18℃）が基本',
        'テーブルサイドでのプレゼンテーションと抜栓の所作',
        'ホスト・テイスティングの意味と手順を理解',
        'ワインの状態異常（ブショネ等）の判別と対応',
    ],
    'ch25_jsa_exam': [
        'J.S.A.ソムリエ呼称認定試験は1次（筆記）・2次（テイスティング）・3次（実技）',
        '1次試験はCBT方式で全国のテストセンターで受験可能',
        '2次試験はワイン・その他酒類のブラインドテイスティング',
        '3次試験はワインのサービス実技',
        '受験資格は飲食業・酒販業等で3年以上の実務経験',
        '合格率は年度により異なるが概ね30〜40%',
    ],
}

# フォールバック（本来到達しない）
DEFAULT_KEY_POINTS_FALLBACK = [
    '概要は準備中です',
]


def clean_ocr_text(text):
    """強化版OCRノイズ除去 v3.0"""
    # === Phase 1: 記号・エンコーディングノイズの除去 ===
    text = re.sub(r'[GE](?:PS?|Zy?|Xr?|Pf?|Pr?|Pz?|rf?|ry?|rz?)》?', '', text)
    text = re.sub(r'《[^》]*》', '', text)
    text = re.sub(r'GPE?f?s?z?r?y?x?》?', '', text)
    text = re.sub(r'GE?f?s?z?r?y?x?\d*》', '', text)
    text = re.sub(r'[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]+', '', text)
    text = re.sub(r'Zy\d*', '', text)  # Zy1, Zy etc.
    text = re.sub(r'[ÿþ]', '', text)  # encoding garbage
    text = re.sub(r'[ヽ*]+[ご]', '', text)  # ヽ*ご pattern
    text = re.sub(r'Pe\]', '', text)  # Pe] noise
    text = re.sub(r'ULは', '', text)  # UL noise
    
    # === Phase 2: OCR数字混入パターン ===
    # っ41, っ42, っ43, っ14 etc. (OCR page numbers mixed into text)
    text = re.sub(r'っ\d{1,3}', '', text)
    text = re.sub(r'レZ\d+', '', text)  # レZ4 etc.
    text = re.sub(r'\d{1,3}/', '', text)  # 19/, 24/, 44/ etc.
    text = re.sub(r'/\d{2,3}', '', text)  # /55 etc.
    text = re.sub(r'7 〇', '', text)  # 7 〇 noise
    text = re.sub(r'時Cr', '', text)  # 時Cr noise
    
    # === Phase 3: 破損カタカナの修復 ===
    text = re.sub(r'ビピノ', 'ピノ', text)
    text = re.sub(r'ブプ(ブ?ル)', 'ブル', text)
    text = re.sub(r'ワヴ', 'ヴ', text)
    text = re.sub(r'ボポ', 'ポ', text)
    text = re.sub(r'けへヘ', 'ヘ', text)
    text = re.sub(r'ミふネ', 'ミネ', text)
    
    # === Phase 4: 改行に挟まった文字化け修復 ===
    # \n に挟まれた孤立カタカナを前の行に結合
    text = re.sub(r'\n([ァ-ヴ])\\\n', r'\1', text)
    text = re.sub(r'\\n', '\n', text)  # escaped newlines
    
    # === Phase 5: ゴミ文字の除去 ===
    text = re.sub(r'[ーー]{3,}', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
    text = re.sub(r'◆◆+', '', text)
    text = re.sub(r'■■+', '', text)
    text = re.sub(r'ごご[""]+', '', text)  # ごご" noise
    
    # === Phase 6: 短い行・ノイズ行の除去 ===
    lines = text.split('\n')
    clean_lines = []
    for line in lines:
        stripped = line.strip()
        # 3文字以下でかつ、意味のある日本語地名でない行を除去
        if len(stripped) <= 3:
            # 許可リスト: 短い地名・用語
            allowed_short = {'長野県', '山梨県', '大阪府', '北海道', '大西洋', '大陸部',
                             'メルロ', 'その他', '刊行会', 'が多い', 'ある。', 'ない)',
                             'ドー/'}
            if stripped not in allowed_short:
                continue
        # 記号のみ・ひらがな助詞のみの行
        if re.match(r'^[のるれをにはがでもるー*\s]+$', stripped):
            continue
        # 英数字1-2文字のみ
        if re.match(r'^[A-Za-z]\d*$', stripped):
            continue
        # 「ョーー」「にトリ」「トドい」「ニーェ」「に・リ」等のナンセンス断片
        if re.match(r'^[ァ-ヴー・]{2,4}$', stripped) and len(stripped) <= 4:
            if stripped not in {'メルロ'}:  # 有効な用語は除外
                continue
        # OCRゴミ判定: 英字+数字のみの断片
        if re.match(r'^[A-Za-z\d/\-\.\s]{1,6}$', stripped):
            continue
        clean_lines.append(line)
    
    return '\n'.join(clean_lines)


def extract_sections(full_text):
    """セクション見出しと本文を抽出"""
    sections = []
    heading_patterns = [
        r'^(\d+)\.\s*(.+)',
        r'^\((\d+)\)\s*(.+)',
        r'^[■●◆▶]\s*(.+)',
        r'^【(.+?)】',
    ]
    
    lines = full_text.split('\n')
    current_heading = None
    current_body = []
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if current_body:
                current_body.append('')
            continue
        
        is_heading = False
        for pattern in heading_patterns:
            m = re.match(pattern, stripped)
            if m and len(stripped) < 60:
                if current_heading and current_body:
                    sections.append({
                        'heading': current_heading,
                        'body': '\n'.join(current_body).strip()
                    })
                current_heading = stripped
                current_body = []
                is_heading = True
                break
        
        if not is_heading:
            if len(stripped) < 40 and not stripped.endswith('。') and not stripped.endswith('、'):
                if any(kw in stripped for kw in ['概論', '概要', '産地', '品種', '醸造', '歴史',
                                                 '分類', '特徴', '制度', '栽培', 'ワイン法',
                                                 '地域', '呼称', '格付け', 'テロワール']):
                    if current_heading and current_body:
                        sections.append({
                            'heading': current_heading,
                            'body': '\n'.join(current_body).strip()
                        })
                    current_heading = stripped
                    current_body = []
                    continue
            current_body.append(stripped)
    
    if current_heading and current_body:
        sections.append({
            'heading': current_heading,
            'body': '\n'.join(current_body).strip()
        })
    
    return sections


def extract_keywords(full_text):
    """キーワードを抽出"""
    keywords = set()
    wine_terms = [
        r'A\.O\.C\.', r'A\.O\.P\.', r'I\.G\.P\.', r'D\.O\.C\.', r'D\.O\.C\.G\.',
        r'テロワール', r'クリマ', r'シャトー', r'ドメーヌ', r'ネゴシアン',
        r'マロラクティック', r'シャプタリザシオン', r'バトナージュ',
        r'ヴェレゾン', r'フィロキセラ', r'ボトリティス',
        r'シャルドネ', r'カベルネ・ソーヴィニヨン', r'ピノ・ノワール', r'メルロ',
        r'リースリング', r'ソーヴィニヨン・ブラン', r'テンプラニーリョ',
        r'サンジョヴェーゼ', r'ネッビオーロ', r'シラー',
        r'ボルドー', r'ブルゴーニュ', r'シャンパーニュ', r'ローヌ', r'ロワール',
        r'アルザス', r'ラングドック', r'プロヴァンス',
        r'ピエモンテ', r'トスカーナ', r'ヴェネト',
        r'リオハ', r'カバ', r'シェリー',
        r'モーゼル', r'ラインガウ',
        r'ナパ・ヴァレー', r'ソノマ',
        r'貴腐', r'アイスワイン', r'ロゼ', r'オレンジワイン',
        r'デキャンタージュ', r'ソムリエ',
    ]
    
    for term in wine_terms:
        if re.search(term, full_text):
            clean = term.replace(r'\.', '.').replace('\\', '')
            keywords.add(clean)
    
    return sorted(list(keywords))[:15]


def build_clean_summary(sections, max_chars, chapter_title):
    """クリーンな概要テキストを構成"""
    parts = []
    budget = max_chars
    
    for sec in sections:
        if budget <= 0:
            break
        
        heading = sec['heading']
        body = sec['body']
        
        # OCRクリーンアップ
        body = clean_ocr_text(body)
        heading = clean_ocr_text(heading)
        
        # 空になった場合はスキップ
        if not body.strip() or not heading.strip():
            continue
        
        # 文単位で取得（。で分割）
        sentences = re.split(r'(?<=。)', body)
        excerpt = []
        char_count = len(heading) + 4  # heading + markdown + newline
        
        for sent in sentences:
            sent = sent.strip()
            if not sent or len(sent) < 5:
                continue
            # ゴミテキスト判定
            if re.match(r'^[A-Za-z\s\d\.\-]+$', sent):
                continue
            if char_count + len(sent) > budget:
                break
            excerpt.append(sent)
            char_count += len(sent)
        
        if excerpt:
            section_text = f"### {heading}\n{''.join(excerpt)}"
            parts.append(section_text)
            budget -= char_count
    
    return '\n\n'.join(parts)


def process_chapter(filepath):
    """1チャプターの概要を生成"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    chapter_id = data['id']
    is_major = chapter_id in MAJOR_CHAPTERS
    max_chars = 5000 if is_major else 3000
    
    # 全テキスト結合
    full_text = '\n\n'.join(page['text'] for page in data.get('pages', []))
    
    # 解析
    sections = extract_sections(full_text)
    keywords = extract_keywords(full_text)
    
    # キュレーション済みKey Pointsを使用
    key_points = CURATED_KEY_POINTS.get(chapter_id, DEFAULT_KEY_POINTS_FALLBACK)
    
    # クリーンな概要生成
    summary = build_clean_summary(sections, max_chars, data['title'])
    
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
        'tier': 'major' if is_major else 'standard',
        'key_points': key_points,
        'keywords': keywords,
        'summary': summary,
        'summary_chars': len(summary),
    }
    
    return summary_data


def main():
    os.makedirs(SUMMARIES_DIR, exist_ok=True)
    
    print("=" * 60)
    print("ソムリエPRO — 概要まとめ生成 v3.0")
    print("=" * 60)
    
    chapter_files = sorted([f for f in os.listdir(CHAPTERS_DIR) if f.endswith('.json')])
    all_summaries = []
    
    for filename in chapter_files:
        filepath = os.path.join(CHAPTERS_DIR, filename)
        summary = process_chapter(filepath)
        all_summaries.append(summary)
        
        # 個別ファイル保存
        out_path = os.path.join(SUMMARIES_DIR, filename)
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        tier_label = "★大国" if summary['tier'] == 'major' else "  標準"
        kp_count = len(summary['key_points'])
        print(f"  {tier_label} | {summary['title']:20s} | {summary['summary_chars']:,}文字 | KP: {kp_count} | KW: {len(summary['keywords'])}")
    
    # 統合インデックス
    index = {
        'project': 'ソムリエPRO',
        'version': '2.0-summaries',
        'total_chapters': len(all_summaries),
        'chapters': all_summaries
    }
    
    index_path = os.path.join(SUMMARIES_DIR, 'summary_index.json')
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    
    total_chars = sum(s['summary_chars'] for s in all_summaries)
    print("=" * 60)
    print(f"合計: {len(all_summaries)}チャプター | {total_chars:,}文字")
    print(f"保存先: {SUMMARIES_DIR}")
    print("=" * 60)


if __name__ == '__main__':
    main()
