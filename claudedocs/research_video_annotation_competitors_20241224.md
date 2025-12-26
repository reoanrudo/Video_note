# 動画アノテーションツール 競合調査レポート

**作成日**: 2024年12月24日
**調査対象**: Video Note と競合する動画アノテーションツール

---

## エグゼクティブサマリー

動画アノテーションツール市場は大きく分けて3つのカテゴリーに分類されます：

1. **AI/ML向けデータアノテーション**: Labelbox、Encord、CVAT
2. **クリエイティブ/マーケティング向けレビュー**: Filestage、Frame.io、Ruttl
3. **スポーツ分析向け**: Kinovea、Hudl、Onform、Lonomatch

Video Note は「スポーツ分析」と「コラボレーション」の中間位置にあり、描画・注釈・スナップショット機能を持つWebアプリケーションです。

---

## 1. カテゴリー別競合分析

### 1.1 AI/ML 向けデータアノテーションツール

| ツール | 主な特徴 | 価格 | 注釈機能 | 共有機能 |
|--------|----------|------|----------|----------|
| **VisionRepo** | エンタープライズ向け、AI支援 | 公開あり | ✔️ タイムライン、AI支援 | ✔️ ロールベース |
| **Encord** | マルチセンサー対応 | 非公開 | ✔️ SAM2、トラッキング | ✔️ アノテーター管理 |
| **Labelbox** | 大規模データセット | エンタープライズ | ✔️ ボックス、ポリゴン | ✔️ チームコラボ |
| **CVAT** | オープンソース | 無料 | ✔️ 補間、自動化 | ✔️ プロジェクト管理 |
| **Labellerr** | 10-20%手動ラベリング | 非公開 | ✔️ セグメンテーション | ✔️ QAワークフロー |
| **Diffgram** | マルチモーダル対応 | オープンソース | ✔️ キーフレーム補間 | ✔️ ロールベース |

**主な機能の比較**:
- **タイムラインベースアノテーション**: VisionRepo, Encord, CVAT, Diffgram
- **AI支援ラベリング**: VisionRepo, Encord, Labellerr, CVAT
- **ピクセルレベルセグメンテーション**: VisionRepo, Encord, Labellerr, CVAT, Diffgram
- **API/SDK**: 全ツール対応

---

### 1.2 クリエイティブ/マーケティング向けレビューツール

| ツール | 主な特徴 | 価格 | 注釈機能 | 共有機能 |
|--------|----------|------|----------|----------|
| **Filestage** | 規制業界向け | $109〜/月 | ✔️ フレーム単位コメント | ✔️ 無制限ユーザー |
| **Frame.io** | Adobe統合 | $15〜/月 | ✔️ タイムコード入力 | ✔️ カメラtoクラウド |
| **Ruttl** | フレーム正確な注釈 | 公開あり | ✔️ フリーハンド、図形 | ✔️ ログイン不要共有 |
| **Veed.io** | 動画編集一体型 | 無料枠あり | ✔️ 描画、テキスト | ✔️ リアルタイム編集 |
| **Picflow** | 画像/動画マークアップ | 公開あり | ✔️ 複数メディア対応 | ✔️ クライアント共有 |
| **Ziflow** | PDF/動画/画像 | 公開あり | ✔️ ハイライト、付箋 | ✔️ プルーフ |

**主な機能の比較**:
- **タイムラインベース**: 一部ツールのみ
- **クリエイティブ編集スイート**: Veed.ioのみ
- **PMツール連携**: Ruttl（Slack, Trello, Asana, ClickUp, Jira）

---

### 1.3 スポーツ分析向けツール

| ツール | 主な特徴 | 価格 | 注釈機能 | 共有機能 |
|--------|----------|------|----------|----------|
| **Kinovea** | 無料デスクトップ | 無料（Patreon支援） | ✔️ 描画、計測、トラッキング | ❌ ローカルのみ |
| **Hudl** | 業界標準 | チーム/組織向け | ✔️ テレストレーション | ✔️ チーム共有 |
| **Hudl Sideline** | リプレイシステム | 要問い合わせ | ✔️ インスタントリプレイ | ✔️ サイドライン共有 |
| **Onform** | AI分析搭載 | 公開あり | ✔️ 描画、比較 | ✔️ コーチング共有 |
| **Once Sport** | 3Dテレストレーション | 要問い合わせ | ✔️ 3D描画、自動トラッキング | ✔️ ライブ分析 |
| **Lonomatch** | マルチカメラ | 要問い合わせ | ✔️ タグ付け、ズーム | ✔️ XMLエクスポート |
| **SPAN** | タグ付け＆スコアリング | 要問い合わせ | ✔️ ビデオタグ付け | ✔️ シームレス統合 |
| **VueMotion** | AI駆動分析 | 要問い合わせ | ✔️ 描画、ボイスオーバー | ✔️ 共有・コラボレーション |

**共通機能**:
- フレーム単位分析
- 描画ツール（テレストレーション）
- 動画比較（並べて比較）
- モーショントラッキング
- 計測ツール（距離、角度）

---

## 2. Video Note との機能比較表

| 機能カテゴリ | 機能 | Video Note | 競合（多くのツール） |
|--------------|------|------------|---------------------|
| **基本機能** | 動画アップロード | ✔️ 500MBまで | ✔️ 様々なサイズ制限 |
| | スナップショット | ✔️ パス保存 | ✗ 独自実装は稀 |
| **描画ツール** | ペン描画 | ✔️ | ✔️ ほぼ全て |
| | 矢印 | ✔️ | ✔️ 多数 |
| | テキスト/数字 | ✔️（自動採番） | ⚠️ 一部のみ |
| | 形状（円/矩形） | ⚠️ 確認要 | ✔️ 多数 |
| **注釈機能** | タイムスタンプ対応 | ✔️ notes配列 | ✔️ 標準 |
| | メモ/ラベル付け | ✔️ | ✔️ 標準 |
| | 外部ノート（コート外） | ✔️ | ✗ 独自機能 |
| **共有機能** | 読み取り専用リンク | ✔️ share_token | ✔️ 標準的 |
| | ログイン不要共有 | ✔️ | ✔️ 一部対応 |
| **価格/制限** | 無料プラン | ✔️ 10プロジェクト | ⚠️ ツールにより異なる |
| | 有料プラン（Pro） | ⚠️ 未実装 | ✔️ 多数が提供 |
| | 保存期間 | 7日間 | ⚠️ 多様 |
| **技術面** | Webベース | ✔️ | ✔️ 多数 |
| | モバイル対応 | ⚠️ 要確認 | ✔️ 多数が対応 |
| | API | ✗ | ✔️ エンタープライズ向け |

---

## 3. 主要な競合の詳細

### 3.1 Kinovea（最も近い競合）
- **タイプ**: デスクトップアプリ（Windows/Mac/Linux）
- **価格**: 無料（Patreonで支援募集）
- **主な機能**:
  - スローモーション再生
  - 動画の比較（並べて表示）
  - 描画、計測、トラッキング
- **弱点**: Webベースでない、クラウド共有不可

### 3.2 Hudl（業界標準）
- **価格**: チーム/組織向け（要問い合わせ）
- **主な機能**:
  - テレストレーション（高度な描画）
  - タグ付けシステム
  - チーム共有
- **Hudl Sideline**: エンドゾーンカメラシステム

### 3.3 Filestage vs Frame.io（コラボレーション競合）

| 項目 | Filestage | Frame.io |
|------|-----------|----------|
| 開始価格 | $109/月 | $15/月 |
| ユーザー | 無制限 | 階層型 |
| 主用途 | 一般コンテンツレビュー | 動画編集ワークフロー |
| 統合 | 幅広い | Adobe/動画ツール特化 |

### 3.4 Ruttl（クリエイティブ向け）
- **価格**: 公開あり、手頃な価格帯
- **主な機能**:
  - フレーム正確な注釈
  - 画面録画 + ウェブカメラ
  - PMツール連携（Slack, Trello, Asana等）
- **採用実績**: Adobe、Nintendo

---

## 4. 市場トレンド

### 4.1 共通する機能要件
1. **タイムラインベースのアノテーション** - AI/MLツールの標準
2. **AI支援ラベリング** - 作業効率化に必須
3. **リアルタイムコラボレーション** - チーム作業に必須
4. **API/SDK** - エンタープライズ統合に必須
5. **QA/レビューワークフロー** - 品質管理に重要

### 4.2 価格トレンド
- **エントリーレベル**: $15〜$50/月
- **プロフェッショナル**: $100〜$200/月
- **エンタープライズ**: 要問い合わせ
- **無料枠**: 多数のツールが提供（制限付き）

---

## 5. Video Note の差別化ポイント

### 5.1 既存の強み
1. **外部ノート機能** - コート外の注釈を保存（独自機能）
2. **スナップショットのパス保存契約** - フロントエンド連携による削除システム
3. **読み取り専用共有** - ログイン不要のシンプル共有
4. **自動採番機能** - 数字注釈の自動連番

### 5.2 改善の機会
1. **Proプランの実装** - 価格差別化が未実装
2. **モバイル対応** - タッチ操作の最適化
3. **API提供** - 外部統合
4. **リアルタイムコラボレーション** - 複数ユーザー同時編集
5. **AI機能** - 自動トラッキング、ポーズ推定
6. **保存期間延長** - 7日制限の緩和（有料版）

---

## 6. 推奨アクション

### 短期（1-3ヶ月）
1. **Proプラン実装** - 保存期間、プロジェクト数の拡張
2. **描画ツールの拡張** - 図形（円、矩形）の追加
3. **モバイル最適化** - レスポンシブ対応強化

### 中期（3-6ヶ月）
1. **APIエンドポイント実装** - 外部ツール連携
2. **リアルタイムコラボレーション** - WebSocket/ライブワイヤー
3. **スナップショット機能強化** - フィルター、注釈付き保存

### 長期（6ヶ月以上）
1. **AI機能統合** - 自動トラッキング、ポーズ推定
2. **プライベートストレージ** - 署名付きURL
3. **動画比較機能** - 並べて比較

---

## 参考ソース

### ツール比較記事
- [Best Video Annotation Tools for 2025](https://ruttl.com/blog/best-video-annotation-tools/)
- [7 Best Video Annotation Tools & Platforms (2025)](https://averroes.ai/blog/video-annotation-tools)
- [15 Best Markup Tools in 2025](https://bugherd.com/blog/15-best-markup-tools-for-websites-pdfs-design-teams-2025)
- [25 Best Annotation Tools](https://www.ziflow.com/blog/annotation-software)
- [Top Video Annotation Tools for Robotics in 2025](https://encord.com/blog/top-video-annotation-tools-for-robotics-in-2025/)
- [Top 8 Video Annotation Tools for Computer Vision](https://medium.com/@encord/top-8-video-annotation-tools-for-computer-vision-updated-2025-895009cba391)

### スポーツ分析ツール
- [Kinovea 公式サイト](https://www.kinovea.org/)
- [Onform Sports Video Analysis](https://onform.com/)
- [Once Sport](https://once.sport/)
- [Lonomatch](https://longomatch.com/en/)
- [SPAN Sports Performance Analysis](https://banyanboard.com/products/span-sports-performance-analysis/)
- [VueMotion](https://www.vuemotion.com/)

### 価格/比較
- [Filestage vs Frame.io](https://filestage.io/filestage-vs-frame-io/)
- [G2 Compare: Filestage vs Frame.io](https://www.g2.com/compare/filestage-vs-frame-io)
- [Top 11 Annotation Tools: Features & Pricing](https://www.markup.io/blog/annotation-tools/)

### 技術記事
- [How to Upload Large Files (500MB+) in Laravel](https://medium.com/@habibur.rahman.0927/how-to-upload-large-files-500mb-in-laravel-without-using-any-packages-ade17ee7245d)
- [Laravel Chunked Upload](https://webdock.io/en/docs/how-guides/laravel-guides/laravel-chunked-upload-uploading-huge-files)
- [Optimizing Large File Uploads in Laravel](https://hafiz.dev/blog/handling-large-file-uploads-in-laravel-without-crashing-your-server)
- [Laravel File Upload & Storage Best Practices](https://www.lexo.ch/blog/2025/08/file-upload-and-storage-in-laravel-best-practices/)

---

*レポート作成: Claude Code (SuperClaude Research Command)*
