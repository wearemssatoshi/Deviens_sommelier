/**
 * DEVIENS SOMMELIER — Médoc 1855 Classification Rank System
 * 
 * 3セッションごとにステータスが昇格。
 * Bordeaux AOC → … → Ch. Lafite Rothschild（全65階級）
 * 
 * Token Economy: 100,000 トークンで卒業（Resident Sommelier Diploma）
 */

// ========== MÉDOC 1855 CLASSIFICATION (65 Levels) ==========
const MEDOC_RANKS = [
    // --- 基礎アペラシオン (Lev 1–4) ---
    { level: 1,  sessions: 0,   name: 'Bordeaux AOC',       nameJa: 'ボルドー',              grade: 'AOC',    gradeJa: 'アペラシオン' },
    { level: 2,  sessions: 3,   name: 'Bordeaux Supérieur',  nameJa: 'ボルドー・シュペリュール', grade: 'AOC',    gradeJa: 'アペラシオン' },
    { level: 3,  sessions: 6,   name: 'Médoc AOC',           nameJa: 'メドック',              grade: 'AOC',    gradeJa: 'アペラシオン' },
    { level: 4,  sessions: 9,   name: 'Haut-Médoc AOC',      nameJa: 'オー・メドック',          grade: 'AOC',    gradeJa: 'アペラシオン' },

    // --- 第5級 / Cinquièmes Crus (Lev 5–22) ---
    { level: 5,  sessions: 12,  name: 'Ch. Cantemerle',           nameJa: 'カントメルル',             grade: '5ème Cru',  gradeJa: '第5級' },
    { level: 6,  sessions: 15,  name: 'Ch. Croizet-Bages',        nameJa: 'クロワゼ・バージュ',         grade: '5ème Cru',  gradeJa: '第5級' },
    { level: 7,  sessions: 18,  name: 'Ch. Clerc Milon',          nameJa: 'クレール・ミロン',           grade: '5ème Cru',  gradeJa: '第5級' },
    { level: 8,  sessions: 21,  name: 'Ch. Cos Labory',           nameJa: 'コス・ラボリ',             grade: '5ème Cru',  gradeJa: '第5級' },
    { level: 9,  sessions: 24,  name: 'Ch. de Camensac',          nameJa: 'カマンサック',             grade: '5ème Cru',  gradeJa: '第5級' },
    { level: 10, sessions: 27,  name: 'Ch. Belgrave',             nameJa: 'ベルグラーヴ',             grade: '5ème Cru',  gradeJa: '第5級' },
    { level: 11, sessions: 30,  name: 'Ch. Pédesclaux',           nameJa: 'ペデスクロー',             grade: '5ème Cru',  gradeJa: '第5級' },
    { level: 12, sessions: 33,  name: 'Ch. Haut-Bages Libéral',   nameJa: 'オー・バージュ・リベラル',     grade: '5ème Cru',  gradeJa: '第5級' },
    { level: 13, sessions: 36,  name: 'Ch. du Tertre',            nameJa: 'デュ・テルトル',            grade: '5ème Cru',  gradeJa: '第5級' },
    { level: 14, sessions: 39,  name: "Ch. d'Armailhac",          nameJa: 'ダルマイヤック',            grade: '5ème Cru',  gradeJa: '第5級' },
    { level: 15, sessions: 42,  name: 'Ch. Dauzac',               nameJa: 'ドーザック',               grade: '5ème Cru',  gradeJa: '第5級' },
    { level: 16, sessions: 45,  name: 'Ch. Lynch-Moussas',        nameJa: 'ランシュ・ムーサ',           grade: '5ème Cru',  gradeJa: '第5級' },
    { level: 17, sessions: 48,  name: 'Ch. Lynch-Bages',          nameJa: 'ランシュ・バージュ',         grade: '5ème Cru',  gradeJa: '第5級' },
    { level: 18, sessions: 51,  name: 'Ch. Grand-Puy-Ducasse',    nameJa: 'グラン・ピュイ・デュカス',    grade: '5ème Cru',  gradeJa: '第5級' },
    { level: 19, sessions: 54,  name: 'Ch. Grand-Puy-Lacoste',    nameJa: 'グラン・ピュイ・ラコスト',    grade: '5ème Cru',  gradeJa: '第5級' },
    { level: 20, sessions: 57,  name: 'Ch. Haut-Batailley',       nameJa: 'オー・バタイエ',            grade: '5ème Cru',  gradeJa: '第5級' },
    { level: 21, sessions: 60,  name: 'Ch. Batailley',            nameJa: 'バタイエ',                grade: '5ème Cru',  gradeJa: '第5級' },
    { level: 22, sessions: 63,  name: 'Ch. Pontet-Canet',         nameJa: 'ポンテ・カネ',             grade: '5ème Cru',  gradeJa: '第5級' },

    // --- 第4級 / Quatrièmes Crus (Lev 23–32) ---
    { level: 23, sessions: 66,  name: 'Ch. Marquis de Terme',     nameJa: 'マルキ・ド・テルム',        grade: '4ème Cru',  gradeJa: '第4級' },
    { level: 24, sessions: 69,  name: 'Ch. Prieuré-Lichine',      nameJa: 'プリューレ・リシーヌ',       grade: '4ème Cru',  gradeJa: '第4級' },
    { level: 25, sessions: 72,  name: 'Ch. Beychevelle',          nameJa: 'ベイシュヴェル',            grade: '4ème Cru',  gradeJa: '第4級' },
    { level: 26, sessions: 75,  name: 'Ch. Lafon-Rochet',         nameJa: 'ラフォン・ロシェ',           grade: '4ème Cru',  gradeJa: '第4級' },
    { level: 27, sessions: 78,  name: 'Ch. La Tour Carnet',       nameJa: 'ラ・トゥール・カルネ',       grade: '4ème Cru',  gradeJa: '第4級' },
    { level: 28, sessions: 81,  name: 'Ch. Pouget',               nameJa: 'プージェ',                grade: '4ème Cru',  gradeJa: '第4級' },
    { level: 29, sessions: 84,  name: 'Ch. Duhart-Milon',         nameJa: 'デュアール・ミロン',         grade: '4ème Cru',  gradeJa: '第4級' },
    { level: 30, sessions: 87,  name: 'Ch. Branaire-Ducru',       nameJa: 'ブラネール・デュクリュ',      grade: '4ème Cru',  gradeJa: '第4級' },
    { level: 31, sessions: 90,  name: 'Ch. Talbot',               nameJa: 'タルボ',                  grade: '4ème Cru',  gradeJa: '第4級' },
    { level: 32, sessions: 93,  name: 'Ch. Saint-Pierre',         nameJa: 'サン・ピエール',            grade: '4ème Cru',  gradeJa: '第4級' },

    // --- 第3級 / Troisièmes Crus (Lev 33–46) ---
    { level: 33, sessions: 96,   name: "Ch. Marquis d'Alesme",     nameJa: 'マルキ・ダレム',            grade: '3ème Cru',  gradeJa: '第3級' },
    { level: 34, sessions: 99,   name: 'Ch. Ferrière',             nameJa: 'フェリエール',             grade: '3ème Cru',  gradeJa: '第3級' },
    { level: 35, sessions: 102,  name: 'Ch. Calon-Ségur',          nameJa: 'カロン・セギュール',         grade: '3ème Cru',  gradeJa: '第3級' },
    { level: 36, sessions: 105,  name: 'Ch. Desmirail',            nameJa: 'デスミライユ',             grade: '3ème Cru',  gradeJa: '第3級' },
    { level: 37, sessions: 108,  name: 'Ch. La Lagune',            nameJa: 'ラ・ラギュンヌ',            grade: '3ème Cru',  gradeJa: '第3級' },
    { level: 38, sessions: 111,  name: 'Ch. Palmer',               nameJa: 'パルメ',                  grade: '3ème Cru',  gradeJa: '第3級' },
    { level: 39, sessions: 114,  name: 'Ch. Cantenac-Brown',       nameJa: 'カントナック・ブラウン',      grade: '3ème Cru',  gradeJa: '第3級' },
    { level: 40, sessions: 117,  name: 'Ch. Boyd-Cantenac',        nameJa: 'ボイド・カントナック',       grade: '3ème Cru',  gradeJa: '第3級' },
    { level: 41, sessions: 120,  name: 'Ch. Malescot St-Exupéry',  nameJa: 'マレスコ・サン・テグジュペリ', grade: '3ème Cru',  gradeJa: '第3級' },
    { level: 42, sessions: 123,  name: 'Ch. Giscours',             nameJa: 'ジスクール',               grade: '3ème Cru',  gradeJa: '第3級' },
    { level: 43, sessions: 126,  name: 'Ch. Langoa Barton',        nameJa: 'ランゴア・バルトン',         grade: '3ème Cru',  gradeJa: '第3級' },
    { level: 44, sessions: 129,  name: 'Ch. Lagrange',             nameJa: 'ラグランジュ',             grade: '3ème Cru',  gradeJa: '第3級' },
    { level: 45, sessions: 132,  name: "Ch. d'Issan",              nameJa: 'ディッサン',               grade: '3ème Cru',  gradeJa: '第3級' },
    { level: 46, sessions: 135,  name: 'Ch. Kirwan',               nameJa: 'キルヴァン',               grade: '3ème Cru',  gradeJa: '第3級' },

    // --- 第2級 / Deuxièmes Crus (Lev 47–60) ---
    { level: 47, sessions: 138,  name: 'Ch. Montrose',             nameJa: 'モンローズ',               grade: '2ème Cru',  gradeJa: '第2級' },
    { level: 48, sessions: 141,  name: "Ch. Cos d'Estournel",      nameJa: 'コス・デストゥルネル',       grade: '2ème Cru',  gradeJa: '第2級' },
    { level: 49, sessions: 144,  name: 'Ch. Ducru-Beaucaillou',    nameJa: 'デュクリュ・ボーカイユ',     grade: '2ème Cru',  gradeJa: '第2級' },
    { level: 50, sessions: 147,  name: 'Ch. Pichon Comtesse',      nameJa: 'ピション・コンテス',         grade: '2ème Cru',  gradeJa: '第2級' },
    { level: 51, sessions: 150,  name: 'Ch. Pichon Baron',         nameJa: 'ピション・バロン',           grade: '2ème Cru',  gradeJa: '第2級' },
    { level: 52, sessions: 153,  name: 'Ch. Brane-Cantenac',       nameJa: 'ブラーヌ・カントナック',     grade: '2ème Cru',  gradeJa: '第2級' },
    { level: 53, sessions: 156,  name: 'Ch. Lascombes',            nameJa: 'ラスコンブ',               grade: '2ème Cru',  gradeJa: '第2級' },
    { level: 54, sessions: 159,  name: 'Ch. Gruaud Larose',        nameJa: 'グリュオー・ラローズ',       grade: '2ème Cru',  gradeJa: '第2級' },
    { level: 55, sessions: 162,  name: 'Ch. Durfort-Vivens',       nameJa: 'デュルフォール・ヴィヴァン',  grade: '2ème Cru',  gradeJa: '第2級' },
    { level: 56, sessions: 165,  name: 'Ch. Léoville Barton',      nameJa: 'レオヴィル・バルトン',       grade: '2ème Cru',  gradeJa: '第2級' },
    { level: 57, sessions: 168,  name: 'Ch. Léoville Poyferré',    nameJa: 'レオヴィル・ポワフェレ',     grade: '2ème Cru',  gradeJa: '第2級' },
    { level: 58, sessions: 171,  name: 'Ch. Léoville Las Cases',   nameJa: 'レオヴィル・ラス・カーズ',    grade: '2ème Cru',  gradeJa: '第2級' },
    { level: 59, sessions: 174,  name: 'Ch. Rauzan-Gassies',       nameJa: 'ローザン・ガシー',          grade: '2ème Cru',  gradeJa: '第2級' },
    { level: 60, sessions: 177,  name: 'Ch. Rauzan-Ségla',         nameJa: 'ローザン・セグラ',          grade: '2ème Cru',  gradeJa: '第2級' },

    // --- 第1級 / Premiers Crus (Lev 61–65) ---
    { level: 61, sessions: 180,  name: 'Ch. Mouton Rothschild',    nameJa: 'ムートン・ロートシルト',     grade: '1er Cru',   gradeJa: '第1級' },
    { level: 62, sessions: 183,  name: 'Ch. Haut-Brion',           nameJa: 'オー・ブリオン',            grade: '1er Cru',   gradeJa: '第1級' },
    { level: 63, sessions: 186,  name: 'Ch. Margaux',              nameJa: 'マルゴー',                grade: '1er Cru',   gradeJa: '第1級' },
    { level: 64, sessions: 189,  name: 'Ch. Latour',               nameJa: 'ラトゥール',               grade: '1er Cru',   gradeJa: '第1級' },
    { level: 65, sessions: 192,  name: 'Ch. Lafite Rothschild',    nameJa: 'ラフィット・ロートシルト',    grade: '1er Cru',   gradeJa: '第1級' },

    // =================================================================
    // 隠しステージ / Hidden Stage: LA FRANCE ÉTERNELLE (Lev 66–100)
    // ラフィット到達者のみが踏み入れる、フランスワインの魂
    // ボルドーで「力」を知り、シャンパーニュで「華」を知り、
    // ブルゴーニュで「魂」を知る。Lv.100 ロマネ・コンティへの道
    // =================================================================

    // --- ボルドー超特ステージ / Bordeaux Beyond 1855 (Lev 66–75) ---
    // 1855年格付けの外に存在する、右岸と甘口の伝説たち
    { level: 66, sessions: 198,  name: 'Ch. Figeac',                          nameJa: 'フィジャック',                   grade: '1er GCC',       gradeJa: 'サンテミリオン第1特別級', hidden: true },
    { level: 67, sessions: 204,  name: 'Ch. Pavie',                           nameJa: 'パヴィ',                        grade: '1er GCC A',     gradeJa: 'サンテミリオン第1特別級A', hidden: true },
    { level: 68, sessions: 210,  name: 'Ch. Angélus',                         nameJa: 'アンジェリュス',                  grade: '1er GCC A',     gradeJa: 'サンテミリオン第1特別級A', hidden: true },
    { level: 69, sessions: 216,  name: 'Ch. Cheval Blanc',                    nameJa: 'シュヴァル・ブラン',               grade: '1er GCC A',     gradeJa: 'サンテミリオン第1特別級A', hidden: true },
    { level: 70, sessions: 222,  name: 'Ch. Ausone',                          nameJa: 'オーゾンヌ',                     grade: '1er GCC A',     gradeJa: 'サンテミリオン第1特別級A', hidden: true },
    { level: 71, sessions: 228,  name: 'Ch. Lafleur',                         nameJa: 'ラフルール',                     grade: 'Cult Pomerol',  gradeJa: 'カルト・ポムロル', hidden: true },
    { level: 72, sessions: 234,  name: 'Le Pin',                              nameJa: 'ル・パン',                       grade: 'Cult Pomerol',  gradeJa: 'カルト・ポムロル', hidden: true },
    { level: 73, sessions: 240,  name: 'Pétrus',                              nameJa: 'ペトリュス',                     grade: 'Cult Pomerol',  gradeJa: 'カルト・ポムロル', hidden: true },
    { level: 74, sessions: 248,  name: "Ch. d'Yquem",                         nameJa: 'ディケム',                       grade: '1er Cru Sup.',  gradeJa: 'ソーテルヌ特別第1級', hidden: true },
    { level: 75, sessions: 256,  name: "Ch. d'Yquem 1811",                    nameJa: 'ディケム 1811',                  grade: 'Légende',       gradeJa: '伝説', hidden: true },

    // --- シャンパーニュ超特ステージ / Champagne Prestige (Lev 76–83) ---
    // 泡の向こうに見える、至高のプレスティージュ・キュヴェ
    { level: 76, sessions: 264,  name: 'Bollinger Vieilles Vignes Françaises', nameJa: 'ボランジェ VVF',                grade: 'Prestige',      gradeJa: 'プレスティージュ', hidden: true },
    { level: 77, sessions: 272,  name: 'Taittinger Comtes de Champagne',      nameJa: 'テタンジェ コント・ド・シャンパーニュ', grade: 'Prestige',   gradeJa: 'プレスティージュ', hidden: true },
    { level: 78, sessions: 280,  name: 'Louis Roederer Cristal',              nameJa: 'ルイ・ロデレール クリスタル',       grade: 'Prestige',      gradeJa: 'プレスティージュ', hidden: true },
    { level: 79, sessions: 288,  name: 'Dom Pérignon P3',                     nameJa: 'ドン・ペリニヨン P3',             grade: 'Prestige',      gradeJa: 'プレスティージュ', hidden: true },
    { level: 80, sessions: 296,  name: 'Krug Clos d\'Ambonnay',               nameJa: 'クリュッグ クロ・ダンボネ',        grade: 'Clos',          gradeJa: 'クロ', hidden: true },
    { level: 81, sessions: 304,  name: 'Krug Clos du Mesnil',                 nameJa: 'クリュッグ クロ・デュ・メニル',     grade: 'Clos',          gradeJa: 'クロ', hidden: true },
    { level: 82, sessions: 312,  name: 'Salon Le Mesnil',                     nameJa: 'サロン ル・メニル',               grade: 'Légende',       gradeJa: '伝説', hidden: true },
    { level: 83, sessions: 320,  name: 'Jacques Selosse Substance',           nameJa: 'ジャック・セロス シュブスタンス',   grade: 'Légende',       gradeJa: '伝説', hidden: true },

    // --- ブルゴーニュ・グラン・クリュ最終章 / Burgundy: The Final Ascension (Lev 84–100) ---
    // フランスワインの魂。テロワールの究極。神の畑へ
    { level: 84, sessions: 330,  name: 'Corton-Charlemagne (Coche-Dury)',     nameJa: 'コルトン・シャルルマーニュ（コシュ・デュリ）', grade: 'Grand Cru', gradeJa: '特級畑', hidden: true },
    { level: 85, sessions: 340,  name: 'Clos de Vougeot (Leroy)',             nameJa: 'クロ・ド・ヴージョ（ルロワ）',       grade: 'Grand Cru',     gradeJa: '特級畑', hidden: true },
    { level: 86, sessions: 350,  name: 'Bâtard-Montrachet (Leflaive)',        nameJa: 'バタール・モンラッシェ（ルフレーヴ）', grade: 'Grand Cru',    gradeJa: '特級畑', hidden: true },
    { level: 87, sessions: 360,  name: 'Clos de la Roche (Ponsot)',           nameJa: 'クロ・ド・ラ・ロッシュ（ポンソ）',   grade: 'Grand Cru',     gradeJa: '特級畑', hidden: true },
    { level: 88, sessions: 370,  name: 'Bonnes-Mares (G. Roumier)',           nameJa: 'ボンヌ・マール（ルーミエ）',        grade: 'Grand Cru',     gradeJa: '特級畑', hidden: true },
    { level: 89, sessions: 380,  name: 'Chambertin (A. Rousseau)',            nameJa: 'シャンベルタン（ルソー）',          grade: 'Grand Cru',     gradeJa: '特級畑', hidden: true },
    { level: 90, sessions: 390,  name: 'Musigny (Leroy)',                     nameJa: 'ミュジニー（ルロワ）',             grade: 'Grand Cru',     gradeJa: '特級畑', hidden: true },
    { level: 91, sessions: 400,  name: 'Montrachet (DRC)',                    nameJa: 'モンラッシェ（DRC）',              grade: 'Grand Cru',     gradeJa: '特級畑', hidden: true },
    { level: 92, sessions: 410,  name: 'Échézeaux (DRC)',                     nameJa: 'エシェゾー（DRC）',               grade: 'Grand Cru DRC', gradeJa: 'DRC', hidden: true },
    { level: 93, sessions: 420,  name: 'Grands Échézeaux (DRC)',              nameJa: 'グラン・エシェゾー（DRC）',         grade: 'Grand Cru DRC', gradeJa: 'DRC', hidden: true },
    { level: 94, sessions: 430,  name: 'Richebourg (DRC)',                    nameJa: 'リシュブール（DRC）',              grade: 'Grand Cru DRC', gradeJa: 'DRC', hidden: true },
    { level: 95, sessions: 440,  name: 'La Tâche (DRC)',                      nameJa: 'ラ・ターシュ（DRC）',              grade: 'Monopole DRC',  gradeJa: 'DRC独占畑', hidden: true },
    { level: 96, sessions: 450,  name: 'Cros Parantoux (Henri Jayer)',        nameJa: 'クロ・パラントゥー（アンリ・ジャイエ）', grade: 'Légende',  gradeJa: '伝説', hidden: true },
    { level: 97, sessions: 460,  name: 'Richebourg 1985 (Henri Jayer)',       nameJa: 'リシュブール 1985（アンリ・ジャイエ）', grade: 'Légende',  gradeJa: '伝説', hidden: true },
    { level: 98, sessions: 475,  name: 'Romanée-St-Vivant (DRC)',             nameJa: 'ロマネ・サン・ヴィヴァン（DRC）',    grade: 'Grand Cru DRC', gradeJa: 'DRC', hidden: true },
    { level: 99, sessions: 490,  name: 'La Romanée (Cte Liger-Belair)',       nameJa: 'ラ・ロマネ（リジェ・ベレール）',     grade: 'Monopole',      gradeJa: '独占畑', hidden: true },
    { level: 100, sessions: 500, name: 'Romanée-Conti (DRC)',                 nameJa: 'ロマネ・コンティ（DRC）',           grade: 'Monopole DRC',  gradeJa: 'DRC独占畑', hidden: true }
];

// ========== TOKEN ECONOMY CONFIG ==========
const TOKEN_ECONOMY = {
    // Quest tier definitions
    tiers: {
        intermediate: {
            id: 'intermediate',
            title: 'Intermédiaire',
            titleJa: '中級',
            testCount: 10,
            unlockType: 'cumulative',  // Unlocked by cumulative token threshold
            unlockCost: 0,             // Free to attempt
            tokenGateStart: 200,       // First test at 200 cumulative
            tokenGateStep: 200,        // Each subsequent test +200
            clearReward: 200,          // First-clear reward
            clearRewardRepeatable: false,
            color: '#E67E22',
            description: '基礎から応用まで幅広い知識を問う中級テスト'
        },
        advanced: {
            id: 'advanced',
            title: 'Avancé',
            titleJa: '上級',
            testCount: 10,
            unlockType: 'wallet',      // Pay from wallet to attempt
            unlockCost: 200,           // 200 tokens per attempt
            clearReward: 1000,         // Reward on pass
            clearRewardRepeatable: true,
            cashbackOnFail: true,      // Partial refund based on score %
            color: '#2980B9',
            prerequisite: 'intermediate', // Must clear intermediate first
            description: '産地・品種・法律を深く掘り下げる難関テスト'
        },
        supreme: {
            id: 'supreme',
            title: 'Suprême',
            titleJa: '最上級',
            testCount: 10,
            unlockType: 'wallet',
            unlockCost: 5000,
            clearReward: 15000,
            clearRewardRepeatable: true,
            cashbackOnFail: true,
            color: '#C9A94E',
            prerequisite: 'advanced',
            cumulativeGate: 10000,     // Also requires 10,000 cumulative tokens
            description: 'エクセレンス級の域に到達する最終試練'
        }
    },

    // Diploma
    diplomaThreshold: 100000,  // 100,000 cumulative tokens for graduation

    // Quiz settings
    questQuizCount: 50,
    passThreshold: 0.9  // 90% = 45/50
};

// ========== HELPER FUNCTIONS ==========

/**
 * Get the current Médoc rank for a given session count
 * @param {number} sessionCount - Total quiz sessions completed
 * @returns {Object} Current rank object from MEDOC_RANKS
 */
function getMedocRank(sessionCount) {
    let current = MEDOC_RANKS[0];
    for (let i = MEDOC_RANKS.length - 1; i >= 0; i--) {
        if (sessionCount >= MEDOC_RANKS[i].sessions) {
            current = MEDOC_RANKS[i];
            break;
        }
    }
    return current;
}

/**
 * Get the next Médoc rank (or null if at max)
 * @param {number} sessionCount
 * @returns {Object|null}
 */
function getNextMedocRank(sessionCount) {
    const current = getMedocRank(sessionCount);
    const nextIndex = MEDOC_RANKS.findIndex(r => r.level === current.level) + 1;
    return nextIndex < MEDOC_RANKS.length ? MEDOC_RANKS[nextIndex] : null;
}

/**
 * Calculate sessions remaining to reach next rank
 * @param {number} sessionCount
 * @returns {number}
 */
function sessionsToNextRank(sessionCount) {
    const next = getNextMedocRank(sessionCount);
    if (!next) return 0;
    return Math.max(0, next.sessions - sessionCount);
}

/**
 * Calculate wallet balance (total_tokens - spent_tokens)
 * @param {number} totalTokens - Cumulative tokens ever earned
 * @param {number} spentTokens - Total tokens spent on quest fees
 * @returns {number}
 */
function getWalletBalance(totalTokens, spentTokens) {
    return Math.max(0, totalTokens - spentTokens);
}

/**
 * Calculate cashback amount on quest failure
 * @param {number} unlockCost - The fee paid
 * @param {number} correctCount - Questions answered correctly
 * @param {number} totalCount - Total questions
 * @returns {number}
 */
function calculateCashback(unlockCost, correctCount, totalCount) {
    if (totalCount <= 0) return 0;
    const ratio = correctCount / totalCount;
    return Math.floor(unlockCost * ratio);
}
