# techcrunchjapan.com

TechCrunch Japan のアーカイブサイトです。[Void](https://void.cloud)（Vite ベースの Cloudflare Workers 向けフルスタックフレームワーク）で動いています。

- UI: React（[Islands](https://void.cloud/guide/pages-routing/islands)）。記事本文などは静的 HTML としてサーバーで描画し、ヘッダーのメニューとサイドバーの開閉だけをブラウザでハイドレートします。
- データベース: TiDB Serverless（MySQL 互換）。本番では Cloudflare Hyperdrive 経由で接続します。
- キャッシュ: 描画したページは Void の ISR で 30 日間エッジにキャッシュします。

## 構成

```
pages/                      ページ（ファイルベースルーティング）
  layout.island.tsx         全ページ共通のレイアウト（Header は island）
  index.island.tsx          / トップページ
  index.server.ts           トップページのローダーと head
  [year]/[month]/[day]/
    [slug].island.tsx       /2022/03/31/slug/ 記事ページ
    [slug].server.ts        記事ページのローダーと head
  author/ category/ tag/ search/
                            アーカイブ作成中のページ
routes/
  api/posts.ts              GET /api/posts
  wp-content/uploads/       /wp-content/uploads/* を R2（r2.techcrunchjapan.com）からプロキシ
middleware/
  01.trailing-slash.ts      末尾スラッシュ付き URL（WordPress 時代の URL）を維持
db/
  schema.ts                 Drizzle スキーマ（Prisma が作成した既存テーブルに対応）
  migrations/               マイグレーション
src/
  components/               React コンポーネント
  lib/                      DB クエリ、日付、head などのユーティリティ
scripts/sitemap.ts          public/{year}.xml のサイトマップ生成
public/                     静的ファイル（CSS、画像、サイトマップ、ads.txt など）
void.config.ts              Void の設定（DB、head、ISR、リダイレクト）
```

## 開発

プロジェクト直下に `.env` を作成し、接続先のデータベースを設定します（Void が読み込むのは `.env` だけです）。

```ini
# TiDB Serverless は TLS が必須なので ssl パラメーターを付けます
DATABASE_URL=mysql://USER:PASSWORD@HOST:4000/DATABASE?ssl={"rejectUnauthorized":true}
```

```bash
bun install
bun run dev
```

http://localhost:5173 で確認できます。開発中は `.env` の `DATABASE_URL` に直接接続します。

ローカルの MySQL を使う場合は、空のデータベースを作成してからテーブルを作成します。

```bash
bunx void db migrate
```

その他のコマンド:

```bash
bun run build      # 本番ビルド（dist/）
bun run preview    # ビルド結果を workerd でプレビュー
bun run typecheck  # 型チェック
```

## デプロイ

Cloudflare アカウントへ直接デプロイします。本番の `DATABASE_URL` を環境変数で渡すと、Void が Hyperdrive を作成し、未適用のマイグレーションを適用してから Worker をアップロードします（`DATABASE_URL` は Worker の設定には書き込まれません）。

```bash
DATABASE_URL='mysql://...' bun run deploy -- --platform cloudflare
```

- 初回はブラウザで Cloudflare にログインします。2 回目以降は保存した設定を使うので `bun run deploy` だけで済みます。
- デプロイで生成される `void.lock.json`（リソース ID とマイグレーション履歴）はコミットしてください。
- カスタムドメインは `bunx void domain add techcrunchjapan.com` で追加します。

### 既存データベースについて

`db/migrations/20261018175830_prisma_baseline.sql` は、Prisma が作成した既存テーブルに対応するベースラインです。すべて `CREATE TABLE IF NOT EXISTS` なので、本番データベースに対しては何も変更せず、`_void_migrations` テーブルに適用済みとして記録されるだけです。空のデータベースではテーブルを作成します。

スキーマを変更するときは `db/schema.ts` を編集して `bunx void db generate` を実行し、生成されたマイグレーションを確認してからコミットします。

## サイトマップ

アーカイブは更新されないため、サイトマップは静的ファイル（`public/sitemap.xml` と `public/{year}.xml`）です。再生成する場合は `.env` に本番の `DATABASE_URL` を設定して実行します。

```bash
bun run sitemap
```
