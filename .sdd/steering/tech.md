# Tech Overview
- フレームワーク: Laravel 12 (PHP 8.4), Fortify 認証, Livewire/Volt, Flux UI, Tailwind v4.
- 開発/実行: Sail (mariadb:11), Vite, npm。DBデフォルトは mariadb コンテナ。
- ストレージ: `public` ディスクを使用。`storage:link` 必須。注釈はJSON、スナップショットは png 保存。
- テスト: Pest v4。Featureテストあり（Projects/Dashboard）。
- ビルド入力: `resources/css/app.css`, `resources/js/app.js` (+ `video-analysis.js` をバンドル)。
- 主要モデル: User, Project, Video。Project hasMany Video。Project に share_token。
- ルーティング: `/dashboard`(認証必須)、`/projects/{project}`、`/share/{token}` (公開閲覧)。動画アップロード/注釈/スナップショットAPIはPOST。
- 認可: ProjectPolicyでowner制御。共有閲覧は認証不要。

## 技術的課題メモ
- 現状スナップショット/動画はローカル保存のみ。S3移行時の抽象化未着手。
- 共有リンクは閲覧専用。匿名編集を許可する場合、署名付きリクエストや別テーブル設計が必要。
- video-analysis.js はバニラJSで実装。React依存なし。

---

## Project Discovery 追記 (2025-12-18)

### 実行/運用（現状）
- Queue: `QUEUE_CONNECTION=database`（ジョブはDBに保存、worker常駐が前提）
- Mail: `MAIL_MAILER=log`（開発ではログ出力。通知は `ShouldQueue`）
- Schedule: `routes/console.php` で日次実行
  - `app:notify-expiring-videos`（00:10）
  - `app:delete-expired-videos`（01:10）

### フロントエンド（現状）
- `vite build` で Rollup のネイティブ依存がOSに依存するため、**Sailでnpmを実行する運用**に寄せる場合は `node_modules` をコンテナ側に分離するのが安全（`compose.yaml` でボリューム分離済み）。

### 制約/注意点
- 500MB制限は Laravel のバリデーションに加えて、PHP設定（`upload_max_filesize`/`post_max_size`）やプロキシ設定にも依存する。
- `public` disk配信は簡単だが、将来 private disk + 署名URL へ移行する余地を残す。

### 合意した決定（更新）
- KPI（週あたりプロジェクト作成数）の記録先は **DB** とする（具体のテーブル設計/粒度は要件フェーズで確定）。
- プランは将来的に「選択できる」ようにするが、当面は **制限解除機能は実装しない**（拡張前提のデータ設計が必要）。
