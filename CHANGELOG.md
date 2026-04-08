# SommelierPRO Changelog

## [v1.1.0] - 2026-04-08
**The "Knowledge Precision & Hero Update" Release**

### Fixed
* **ナレッジベース復旧**: `knowledge_lite.json` が古いまま(3,278チャンク)だった問題を修正。全3,543チャンク(27章)に同期。ch26(2025年追加資料・265チャンク)がRAG検索に復帰。
* **OCRノイズ除去**: 制御文字(19チャンク)、OCR誤読「Eもに」→「ともに」(29チャンク)を含む計1,340チャンクをクリーニング。
* **Embedding次元メタデータ修正**: `embedding_dim` が3072と誤記録されていた問題を768に修正。

### Changed
* **2025最新版ヒーローカード**: 13個の国別アップデートチャプター(ch26-ch38)を3つのヒーローに統合:
  1. ヨーロッパ最新版 (仏・伊・西・独・瑞・希 / 73p / 252K字)
  2. 新世界 & アジア最新版 (米・智・亜・南ア・日 / 17p / 30K字)
  3. テイスティング & マネジメント最新版 (7p / 12K字)
* **カテゴリナビゲーション**: 「2025最新版」カテゴリを追加。
* **バージョン表記**: フッターにバージョン番号(v1.1.0)を表示。

### Added
* サムネイル画像8枚追加(G生成)

*Co-authored by KAI (Claude Opus 4.6) & G (Gemini)*

---

## [v1.0.0] - 2026-04-04
**The "Interactive Intelligence & Grind" Update**

### Added
* **Talent Intelligence (TI) Profile Chips**: ログイン画面やヘッダーに、顔写真とステータス（「🍷 受験生」など）が付随したリッチなUIチップを表示。フロントエンド側の `app/users_meta.js` でメタデータを管理することで、GAS側の構成を変えずに拡張性を担保。
* **無限補習（Extra）セッション**: 朝・休憩・帰り道の正規セッション（1日1回制限）に加え、何度でも挑戦可能な「補習」枠を追加。
* **泥臭い「成長（Grind）」のログ記録**: GASバックエンドの `handleSaveResult` にて、`session === 'extra'` の場合は上書き（UPSERT）せず、行を追加（APPEND）する仕様に変更。何度補習を受けたかの努力量をすべてTI/MF視点での「圧倒的行動量」として蓄積する方針を採用。
* **ハルシネーション・チェック**: クイズ結果画面にシールドアイコン（盾とチェックマーク）で表示されるクイズ検証機能を追加。直近10問について捏造がないかをAIが確認。
* **AIキーワードドリルダウン**: チャプター詳細画面のタグ（Keyword）をタップするとAIコンシェルジュが即座に起動し、深く掘り下げた解説を提供するイベントバスを構築。

### Improved
* **Gemini 3.1 Flash Lite Previewの完全統合**: クイズ生成エンジン及びAIコンシェルジュの双方で低コスト・高安定モデル `gemini-3.1-flash-lite-preview` を採用（フォールバック: `gemini-2.5-pro`）。生成クラッシュの原因となっていた未対応オプション (`responseMimeType: application/json`) を撤去し、ロバストなJSONパース（フォールバック）で安定稼働を実現。
* **UI/UXの洗練**: 探偵の絵文字を廃止し、NewsPicksライクな洗練されたSVGアイコンを採用。モバイル（PWA）体験の向上。

---

*This log is officially recorded as part of the SVD-OS Educational Sub-Ecosystem documentation by Agent Antigravity.*
