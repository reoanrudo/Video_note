# Repository Structure Notes
- routes: `routes/web.php` (dashboard, projects, share, settings Volt routes)。
- controllers: DashboardController, ProjectController, ProjectVideoController, ProjectShareController。
- models: User, Project, Video。factories付き。
- policies: ProjectPolicy。
- requests: StoreProjectRequest, StoreProjectVideoRequest, UpdateVideoAnnotationsRequest, StoreVideoSnapshotRequest。
- views: `resources/views/dashboard.blade.php`, `resources/views/projects/show.blade.php`, layouts(app/public/auth), Livewire auth/settings。
- assets: `resources/js/video-analysis.js`(描画・保存ロジック), `resources/js/app.js` から import。
- tests: Pest Feature `ProjectsTest`, `DashboardTest`。
- migrations: projects, videos, users/sessions/jobs/cache など標準。

## 気づいたパターン
- Flux UI コンポーネントでレイアウト。Tailwind v4.
- 認証導線: Fortify home=/dashboard。
- 共有閲覧は public layout を新設。

## TODO / 調査メモ
- S3 等外部ストレージが必要なら disk 切替の設定追加。
- video-analysis.js の型/テスト未整備。必要なら分割/型付け。
- ルート保護の見直し（共有での操作権限をどうするか）。

---

## Project Discovery（コード把握）(2025-12-18)

### エントリポイント
- ルーティング: `routes/web.php`
- スケジュール: `routes/console.php`（通知/削除のコマンドを日次実行）
- フロント: `resources/js/app.js` → `resources/js/video-analysis.js`

### 既存パターン（再利用したい）
- バリデーション: FormRequest（`app/Http/Requests/*`）
- 認可: `ProjectPolicy` + controllerで `authorize()`
- ストレージ: `Storage::disk('public')`（動画/スナップショット）
- 共有: `share_token` でプロジェクトを特定し、同じ `projects.show` を `readOnly=true` で再利用

### 既知の技術的負債/注意（後続TODO）
- スナップショットの削除が `videos.annotations.snapshots[*].path` に依存しているため、フロントが `path` を保存しないと削除漏れが起きうる（契約/テストで担保が必要）。
- `video-analysis.js` が単一巨大ファイルで責務が広い（UI構築・状態管理・描画・通信が同居）。将来の改修に備え、分割戦略（モジュール化）を検討。
- 共有の「拒否ステータス」をどう固定するか（未ログインで保存系にアクセスすると `auth` により 302 になりやすい）。
  - 現状方針: まずは **302（ログインへのリダイレクト）を許容**し、必要になった時点で 401/403/404 へ寄せる。
