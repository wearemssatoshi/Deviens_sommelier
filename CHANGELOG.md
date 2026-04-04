# SommelierPRO Changelog

## [v1.0.0] - 2026-04-04
**The "Interactive Intelligence & Grind" Update**

### Added
* **Talent Intelligence (TI) Profile Chips**: ログイン画面やヘッダーに、顔写真とステータス（「🍷 受験生」など）が付随したリッチなUIチップを表示。フロントエンド側の `app/users_meta.js` でメタデータを管理することで、GAS側の構成を変えずに拡張性を担保。
* **無限補習（Extra）セッション**: 朝・休憩・帰り道の正規セッション（1日1回制限）に加え、何度でも挑戦可能な「補習」枠を追加。
* **泥臭い「成長（Grind）」のログ記録**: GASバックエンドの `handleSaveResult` にて、`session === 'extra'` の場合は上書き（UPSERT）せず、行を追加（APPEND）する仕様に変更。何度補習を受けたかの努力量をすべてTI/MF視点での「圧倒的行動量」として蓄積する方針を採用。
* **ハルシネーション・チェック**: クイズ結果画面にシールドアイコン（盾とチェックマーク）で表示されるクイズ検証機能を追加。直近10問について捏造がないかをAIが確認。
* **AIキーワードドリルダウン**: チャプター詳細画面のタグ（Keyword）をタップするとAIコンシェルジュが即座に起動し、深く掘り下げた解説を提供するイベントバスを構築。

### Improved
* **Gemini 3.1 Pro Previewの完全統合**: クイズ生成エンジン及びAIコンシェルジュの双方で最新の推論モデル `gemini-3.1-pro-preview` を採用。生成クラッシュの原因となっていた未対応オプション (`responseMimeType: application/json`) を撤去し、ロバストなJSONパース（フォールバック）で安定稼働を実現。
* **UI/UXの洗練**: 探偵の絵文字を廃止し、NewsPicksライクな洗練されたSVGアイコンを採用。モバイル（PWA）体験の向上。

---

*This log is officially recorded as part of the SVD-OS Educational Sub-Ecosystem documentation by Agent Antigravity.*
