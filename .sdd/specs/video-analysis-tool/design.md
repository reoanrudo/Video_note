# Design（動画解析ツール / Video Note）

## 0. 前提・要件参照

- 要件: `.sdd/specs/video-analysis-tool/requirements.md`
- リポジトリ方針/構造: `.sdd/steering/product.md`, `.sdd/steering/structure.md`, `.sdd/steering/tech.md`

### 未決事項の扱い

- **削除前通知**は、現状実装が **メール通知（期限24時間前）**に確定しているため、本設計でもそれを前提とする。
- **共有閲覧者の保存系アクセス**は、現状は `auth` により **302（ログイン画面へ）**になりやすい。仕様として **302を許容**し、必要になった時点で 401/403/404 に寄せる。

## 1. アーキテクチャ概要

### システム境界

- **Backend**: Laravel 12（Fortify 認証 / Policy 認可 / Notifications / Console Commands / Scheduler / Queue）
- **Frontend**: Blade + Vite + `resources/js/video-analysis.js`（バニラJS）
- **Storage**: `public` ディスク（動画・スナップショット画像）
- **DB**: MariaDB（Sail）

### データフロー（概要）

```
ブラウザ(オーナー)
  ├─(1) POST /projects                   -> projects 作成（上限10）
  ├─(2) POST /projects/{project}/videos  -> public diskへ動画保存 + videos 作成
  ├─(3) POST /.../annotations            -> videos.annotations(JSON) 更新
  └─(4) POST /.../snapshots              -> public diskへpng保存（戻り値を annotations に反映）

ブラウザ(閲覧者/匿名)
  └─(5) GET /share/{token}               -> projects.show（readOnly=true）で閲覧のみ

スケジューラ（毎日）
  ├─(6) app:notify-expiring-videos       -> 7日削除の24h前にメール通知（Queue）
  └─(7) app:delete-expired-videos        -> 7日経過の動画/スナップショット/DB削除

サーバー（イベント記録）
  └─(8) プロジェクト作成時               -> KPIイベントをDBへ記録
```

### 主要コンポーネント

- 画面/ルート
  - `GET /dashboard`（認証+verified）
  - `GET /projects/{project}`（認証+verified、オーナー閲覧）
  - `GET /share/{token}`（認証不要、閲覧のみ）
- API（いずれもオーナーのみ）
  - `POST /projects`
  - `POST /projects/{project}/videos`
  - `POST /projects/{project}/videos/{video}/annotations`
  - `POST /projects/{project}/videos/{video}/snapshots`
  - `POST /projects/{project}/share-token`
- 権限
  - `ProjectPolicy` により `view/update` をオーナー限定
  - 共有ルートはトークン一致のみで閲覧（保存系APIは auth + policy で遮断）

## 2. データモデル

### 2.1 テーブル

#### `projects`

- `id`
- `user_id`（owner）
- `name`
- `share_token`（nullable, unique, 64）
- `created_at`, `updated_at`

#### `videos`

- `id`
- `project_id`
- `original_name`
- `path`（public disk 上の相対パス）
- `mime_type`（nullable）
- `size`（nullable）
- `annotations`（json, nullable）
- `meta`（json, nullable）
- `created_at`, `updated_at`

#### `kpi_events`（新規・KPI記録用）

週次集計（週あたりのプロジェクト作成数）を可能にするため、プロジェクト作成時にイベントをDBへ記録する。

- `id`
- `event`（例: `project_created`）
- `user_id`（nullableにするかは要件で確定。まずは必須想定）
- `project_id`（nullableにするかは要件で確定。まずは必須想定）
- `occurred_at`（集計基準時刻）
- `meta`（json, nullable: 将来の追加情報用）
- `created_at`, `updated_at`

#### `users`（拡張: プラン選択）

将来の課金/制限緩和に備え、ユーザーがプランを選択できるようにする（現時点では制限解除はしない）。

推奨:
- `users.plan`（string、例: `free` / `pro` など。初期値 `free`）

### 2.2 `annotations` JSON スキーマ（契約）

`videos.annotations` は「描画情報 + スナップショット + UI設定」をまとめて保存する。

```
{
  "drawings": Drawing[],
  "snapshots": Snapshot[],
  "settings": {
    "color": string,
    "width": number,
    "autoNumber": number
  }
}
```

#### Snapshot（重要）

現状の削除コマンドは `annotations.snapshots[*].path` を参照して削除する設計のため、**スナップショット保存時には `path` を必ず保存する**。

推奨スキーマ:

```
{
  "time": number,        // 秒
  "url": string,         // /storage/...
  "path": string,        // projects/{project}/snapshots/{video}/{uuid}.png
  "memo": string|null    // 任意
}
```

## 3. API 契約（Web/JSON）

### 3.1 プロジェクト作成

- `POST /projects`
- 認証: 必須
- 入力: `name`
- 振る舞い:
  - 無料ユーザー上限 `10` を超える場合はバリデーションエラーを返す
  - 作成時に `share_token` を発行
  - 作成イベントを KPI 計測用にDBへ記録（`kpi_events`）

### 3.2 動画アップロード

- `POST /projects/{project}/videos`
- 認証: 必須（ownerのみ）
- 入力: multipart `video`
  - 上限: 500MB
  - 許可 MIME: `video/mp4`, `video/quicktime`, `video/webm`, `video/ogg`（+運用上の `application/octet-stream` 許容）
- 出力（JSON時）:
  - `video_id`
  - `video_url`
  - `save_url`（注釈保存先）
  - `snapshot_url`（スナップショット保存先）
  - `annotations`（初期値）

### 3.3 注釈保存

- `POST /projects/{project}/videos/{video}/annotations`
- 認証: 必須（ownerのみ）
- 入力: `annotations`（array）
- 出力: `ok`, `updated_at`

### 3.4 スナップショット保存

- `POST /projects/{project}/videos/{video}/snapshots`
- 認証: 必須（ownerのみ）
- 入力:
  - `image`（`data:image/png;base64,...`）
  - `time`（numeric, >=0）
- 出力:
  - `url`（表示用）
  - `path`（保持/削除用。クライアントが annotations に保存する）
  - `time`

## 4. パターン選定と代替案

### 採用

- **注釈をJSONカラムで保持**: 変更頻度が高く、スキーマ進化に強い。MVPでの実装コストが低い。
- **共有は `projects.share_token`**: 共有単位がプロジェクトで十分、レコード追加なしで運用可能。
- **スナップショットをpublic diskに保存**: 共有閲覧での配信が容易（`/storage/...`）。
- **KPIはDBのイベントテーブルに記録**: 集計と将来の分析拡張が容易。外部基盤は後続でも移行できる。
- **プランは users に選択状態のみ保持**: 先に「選べる」状態を作り、制限解除（機能差分）は後続で実装する。

### 代替案（不採用/先送り）

- 注釈/スナップショットを正規化（別テーブル）:
  - 検索や集計に強い反面、MVPに対して実装が重い。将来、分析要件が固まったら移行を検討。
- スナップショットをmultipartで直接アップロード:
  - base64より効率的だが、フロント実装/UXが複雑化するため現状は維持。
- 共有URLを署名付きURLにする:
  - 有効期限や失効管理に強いが、現状は `share_token` の再生成で十分。

## 5. リスクと対策

1) **動画/スナップショットがpublicに置かれる**
   - 対策: パスを推測しづらいUUID名にする（実装済み）、将来は private disk + 署名URL 配信を検討。

2) **スナップショットの削除漏れ**
   - 現状: 削除コマンドは `annotations.snapshots[*].path` に依存。
   - 対策: クライアントが `path` を必ず annotations に保存する契約に統一（設計で明記、テストで担保）。

3) **500MBアップロードの環境依存**
   - 対策: PHP/Nginx/Apache の `upload_max_filesize` / `post_max_size` / リバプロ設定をデプロイ手順に明記。

4) **通知がキューに依存**
   - 対策: 本番は queue worker を常駐、失敗時は failed_jobs を監視。開発は `MAIL_MAILER=log` で確認。

5) **「無料ユーザー」の定義が未実装**
   - 対策: 現状は全ユーザーを無料扱い（制限/削除）として運用。将来は `users` にプラン識別子追加などで分岐。

6) **KPIイベントの肥大化/拡張でスキーマが揺れる**
   - 対策: `meta`（json）を持たせて将来拡張に備える。集計に必要な最小情報はカラムとして固定する。

## 6. テスト戦略（Pest）

### Feature（HTTP）

- プロジェクト作成（上限10件、エラーメッセージ）
- 動画アップロード（500MB超のバリデーション、MIME制限）
- 注釈保存（ownerのみ、JSONが保存される）
- 共有閲覧（匿名で閲覧可、保存系エンドポイントは拒否）
- KPIイベント記録（プロジェクト作成時にDBへ記録される）
- プラン選択（選択状態が永続化される）

### Command / Notification

- `app:notify-expiring-videos`
  - `Notification::fake()` で送信対象が正しいことを確認（期限24h前）
- `app:delete-expired-videos`
  - `Storage::fake('public')` で動画/スナップショットの削除を確認
  - DBレコード削除を確認

### 重要なテスト観点

- `snapshots[].path` を保存しないケースで削除漏れが起きるため、**スナップショット保存→注釈保存→削除ジョブ**までを1本のテストでカバーするのが望ましい。

## 7. デプロイ/運用・移行考慮

- `php artisan storage:link` が必須（`/storage` 経由で配信）
- Scheduler を有効化（cron またはプラットフォームのスケジューラ）し、`routes/console.php` の日次実行を担保
- Queue worker を常駐（`QUEUE_CONNECTION=database` 前提なら DB と `jobs` テーブル）
- メール設定（本番は `MAIL_MAILER=smtp` 等へ変更）
- 大容量アップロードの制限値をインフラに合わせて調整
