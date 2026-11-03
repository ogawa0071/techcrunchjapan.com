# TechCrunch Japan Archive

[techcrunchjapan.com](https://techcrunchjapan.com) — TechCrunch Japan（2006〜2022年）の記事アーカイブです。

## 構成

| 役割                            | 使用技術                                                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| ホスティング                    | [Cloudflare Workers](https://developers.cloudflare.com/workers/)（静的ファイルは Static Assets）                            |
| フレームワーク                  | [TanStack Start](https://tanstack.com/start) (React 19) + Vite 8                                                            |
| データベース                    | [Neon](https://neon.com) (PostgreSQL)。Worker からは [Hyperdrive](https://developers.cloudflare.com/hyperdrive/) 経由で接続 |
| ORM / マイグレーション          | [Drizzle ORM](https://orm.drizzle.team) / drizzle-kit                                                                       |
| Lint / Format                   | [Oxc](https://oxc.rs)（oxlint / oxfmt）                                                                                     |
| テスト / 型チェック             | Vitest / TypeScript 7                                                                                                       |
| 画像（`/wp-content/uploads/*`） | R2（`r2.techcrunchjapan.com`）を Worker がプロキシ                                                                          |
| パッケージマネージャ            | Bun                                                                                                                         |

```
src/
  server.ts            Worker のエントリ（旧 URL のリダイレクト、画像プロキシ、エッジキャッシュ）
  router.tsx           ルーター設定
  routes/              ページ（ファイルベースルーティング）
  components/          UI（旧 WordPress テーマのマークアップ / CSS を踏襲）
  server/functions.ts  サーバー関数（ページのデータ取得。クライアント遷移時は GET /_serverFn/…）
  server/*.server.ts   DB アクセス（サーバー専用）
  db/schema.ts         Drizzle スキーマ
  lib/                 日付・URL・スラッグ・SEO などの共通処理
drizzle/               マイグレーション SQL（drizzle-kit で生成）
scripts/               TiDB → Neon のデータ移行、サイトマップ生成
public/                静的ファイル（テーマ CSS・画像、サイトマップ、ads.txt、robots.txt、_headers）
```

## 開発

必要なもの: [Bun](https://bun.sh)、Node.js 22.12 以上（推奨 24）、PostgreSQL（ローカルの PostgreSQL か Neon のブランチ）

```bash
bun install
```

接続先の DB を `.env` に書きます（`.env.example` 参照）。`DATABASE_URL` はマイグレーションとスクリプト用、`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` は開発サーバー用です。どちらも指定しなければ `wrangler.jsonc` の `localConnectionString`（`postgres:postgres@localhost:5432/techcrunchjapan`）が使われます。

```bash
cp .env.example .env
```

ローカルの PostgreSQL を使う場合はデータベースを作ってから、テーブルを作成します。

```bash
createdb techcrunchjapan
```

```bash
bun run db:migrate
```

記事データは、Neon のブランチを使うか、Neon から `pg_dump` で取り込むか、TiDB から `bun run db:copy-from-tidb` でコピーして用意します。開発サーバーを起動します。

```bash
bun run dev
```

### コマンド

| コマンド                       | 内容                                                             |
| ------------------------------ | ---------------------------------------------------------------- |
| `bun run dev`                  | 開発サーバー（Worker は workerd 上で動作）                       |
| `bun run build`                | 本番ビルド（`dist/`）                                            |
| `bun run preview`              | 本番ビルドをローカルの workerd で実行                            |
| `bun run deploy`               | ビルドして Cloudflare にデプロイ                                 |
| `bun run check`                | 型チェック・lint・フォーマット・テストをまとめて実行             |
| `bun run typecheck`            | `wrangler types`（`worker-configuration.d.ts` の生成）+ `tsc -b` |
| `bun run lint` / `bun run fmt` | oxlint / oxfmt                                                   |
| `bun run test`                 | Vitest                                                           |
| `bun run db:generate`          | `src/db/schema.ts` の変更からマイグレーション SQL を生成         |
| `bun run db:migrate`           | マイグレーションを `DATABASE_URL` の DB に適用                   |
| `bun run db:studio`            | Drizzle Studio                                                   |
| `bun run db:copy-from-tidb`    | TiDB から Neon へデータをコピー（後述）                          |
| `bun run sitemap`              | `public/` のサイトマップを DB から再生成                         |

`.env` は Bun で実行するスクリプト、drizzle-kit、wrangler / Vite（開発サーバー）がそれぞれ読み込みます。

## 本番環境の構築（初回のみ）

1. **Neon** でプロジェクトを作成します（リージョンは AWS Asia Pacific (Tokyo) を推奨）。
2. **テーブル作成**: Neon の direct 接続文字列（`-pooler` が付かない方）でマイグレーションを適用します。証明書を検証するため `sslmode=verify-full` を指定します。タイトル検索用の `pg_trgm` 拡張もここで作成されます。

   ```bash
   DATABASE_URL="postgresql://…neon.tech/neondb?sslmode=verify-full" bun run db:migrate
   ```

3. **データ移行**: TiDB から Neon にデータをコピーします。500 件ずつ（`BATCH_SIZE` で変更可）トランザクション単位で書き込み、主キーで upsert するので、途中で止まっても再実行できます（変更のない行は書き換えません）。最後に移行元と移行先の件数を照合し、合わなければ終了コード 1 で終わります。TiDB への接続は TLS（証明書とホスト名を検証）です。

   ```bash
   SOURCE_DATABASE_URL="mysql://USER:PASSWORD@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/DB" \
   DATABASE_URL="postgresql://…neon.tech/neondb?sslmode=verify-full" \
   bun run db:copy-from-tidb
   ```

4. **Hyperdrive** を作成し、表示された id を `wrangler.jsonc` の `hyperdrive[0].id` に設定します。接続文字列は Neon の direct 接続（`-pooler` が付かない方）を使います。データは更新されないので、クエリキャッシュは上限の 1 時間にしています（既定は 60 秒）。

   ```bash
   bunx wrangler hyperdrive create techcrunchjapan --max-age=3600 --connection-string="postgresql://…neon.tech/neondb?sslmode=require"
   ```

   アプリのクエリは Hyperdrive がキャッシュできる形（STABLE / VOLATILE な関数を使わない）にしています。Hyperdrive は Workers の無料プランでも使えますが、1 日あたり 10 万クエリ（キャッシュヒットを含む）の上限があります。ページはエッジでキャッシュするため、通常はこの上限より十分少なくなります。

5. **デプロイ**して `*.workers.dev` で動作を確認します。

   ```bash
   bun run deploy
   ```

6. **ドメインの切り替え**:
   1. Cloudflare DNS にある Vercel 向けのレコード（`techcrunchjapan.com` と `www.techcrunchjapan.com`）を削除します。
   2. `wrangler.jsonc` の `routes`（カスタムドメイン）のコメントを外し、`workers_dev` を `false` にして再度デプロイします。DNS レコードと証明書は Cloudflare が作成します。www へのアクセスは Worker が `https://techcrunchjapan.com/…` へ 301 リダイレクトします。
   3. Vercel で自動だった HTTPS への転送と HSTS は、Worker が HTTP のアクセスを HTTPS へリダイレクトし、`Strict-Transport-Security` ヘッダーを付けることで引き継いでいます。静的ファイルも含めて確実にするため、Cloudflare のゾーン設定で「Always Use HTTPS」も有効にしてください。
   4. ゾーンのセキュリティ設定（Bot Fight Mode など）が `r2.techcrunchjapan.com` へのアクセスにチャレンジを出していないか確認します（Worker が画像を取得できなくなります）。
   5. 最後に Vercel のプロジェクトを削除します。

7. **サイトマップの再生成**（任意）: Neon のデータから `lastmod` 付きのサイトマップを作り直してコミットします。

   ```bash
   DATABASE_URL="postgresql://…" bun run sitemap
   ```

Git 連携の [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) を使う場合は、ビルドコマンドを `bun run build`、デプロイコマンドを `bunx wrangler deploy` にします（Bun のバージョンは `package.json` の `packageManager` で固定しています）。main 以外のブランチのビルドは既定で `npx wrangler preview` を実行しますが、Preview にはバインディングが引き継がれないため、そのコマンドを `bunx wrangler versions upload` に変えるか、main 以外のビルドを無効にしてください。

### プラン

SSR を行うため **Workers Paid プラン**（月 5 ドル〜）を推奨します。無料プランは 1 リクエストあたりの CPU 時間が 10ms で、キャッシュされていない長い記事のレンダリングが上限を超えることがあります（Error 1102）。データベースへのアクセス待ちは CPU 時間に含まれません。

## キャッシュ

- **静的ファイル**（`public/`、ビルド済み JS / CSS）は Worker を通らずに配信されます。キャッシュ期間は `public/_headers` で指定しています。
- **ページと、クライアント遷移時のデータ（GET `/_serverFn/…`）** は、既定では Worker が Cache API でデータセンターごとに 30 日間キャッシュします（旧 ISR の `revalidate` と同じ）。404 は 1 日です。キャッシュキーにデプロイのバージョンを含めているため、デプロイすると新しいキャッシュに切り替わります。レスポンスヘッダー `X-Edge-Cache` で HIT / MISS を確認できます。ブラウザには毎回再検証させます（`Cache-Control: max-age=0`）。
- Workers Paid プランなら Cloudflare の [Workers Cache](https://developers.cloudflare.com/workers/cache/) への切り替えをおすすめします。ヒット時は Worker を実行せずに階層型の共有キャッシュから返し、期限切れのページは裏で再生成されます（ISR と同じ動き）。`wrangler.jsonc` の `"cache": { "enabled": true }` のコメントを外し、`vars.EDGE_CACHE` を `"none"` にします。Worker はそのためのヘッダー（`Cloudflare-CDN-Cache-Control`）を常に付けています。Workers Cache を有効にすると静的ファイルへのリクエストも Worker のリクエストとして課金されます。また、キャッシュミス時に DB の近くで実行するよう `placement` の設定もコメントで用意しています。
- **画像**（`/wp-content/uploads/*`）は R2 から取得し、Cloudflare のキャッシュに 1 年間（404 は 1 日）保存します。

## 旧構成（Vercel + Next.js + TiDB + Prisma）からの変更点

- **superjson / babel-plugin-superjson-next**: Next.js の `getStaticProps` が `Date` を返せないため、Prisma の `Date` をページに渡す用途で使われていました。TanStack Start のサーバー関数とローダーは `Date` をそのまま受け渡しできるので削除しました。
- **jsdom**: 記事一覧の抜粋と meta description 用に、本文 HTML からテキストを取り出すのに使われていました。抜粋はデータ移行時に計算して `posts.excerpt` に保存するようにしたので（`scripts/lib/excerpt.ts`、htmlparser2 を使用）、実行時の HTML パースは不要になりました。
- **ESLint / Prettier** → oxlint / oxfmt。**Prisma** → Drizzle。
- **URL の扱い**
  - スラッグに %エンコードを含む記事（日本語スラッグなど 117 件）が表示できなかったのを修正しました。WordPress のスラッグは小文字の %エンコード形式で保存されていますが、旧実装はデコード後の値で検索していたため 60 件が 404 に、191 文字で切れたスラッグ（旧 MySQL スキーマの `VARCHAR(191)`）のうち %エンコードの途中で切れた 57 件が 400 になっていました。末尾の壊れた部分を `%25` にエスケープした URL に 301 リダイレクトします（`public/` のサイトマップも同じ形式に更新済み）。191 文字を超える元の長いスラッグでもアクセスできます。
  - 記事の URL は `/YYYY/MM/DD/スラッグ/`（ゼロ埋め）のみとし、日付が正しくない URL（`/1999/01/01/final/` など）は正規の URL へクエリ文字列ごと 301 リダイレクトします（旧実装は同じ記事をそのまま表示）。`/2022/3/31/final/` のような別の形式は 404 です。
  - WordPress 時代の日付なしパーマリンク `/archives/<スラッグ>/`、`/archives/<記事 ID>/` と短縮 URL `/?p=<記事 ID>` を記事へ 301 リダイレクトします（旧実装は 404 へのリダイレクト）。
  - `/archives/*` のリダイレクトを 307 から 301 に変更しました。末尾スラッシュの補完は 308 から 301 になっています。WordPress の検索 URL `/?s=…` は `/search/…/` へリダイレクトします。
- **ページ**: 「アーカイブ作成中」だったカテゴリ・タグ・著者・検索（記事タイトル検索）ページを実装し、トップページを含めてページ送りを付けました。404 ページはサイトのレイアウト内に表示します。
- **SEO**: `<html lang="ja">`、記事ごとの canonical・OGP・`article:published_time`・JSON-LD（NewsArticle）、検索結果ページの `noindex`、`robots.txt` を追加しました。サイトマップの生成スクリプトは `lastmod` も出力します（コミット済みのサイトマップには、`bun run sitemap` で再生成するまで `lastmod` はありません）。
- **障害時**: DB に接続できないときは 503 とエラー画面を返し、エッジにはキャッシュしません。GET 以外のリクエストには 405 を返します。
- **画像**: `/wp-content/uploads/*` のリサイズ用クエリ（`?w=…&h=…&crop=1`）は R2 では効かないため、プロキシ時に取り除いてキャッシュを共有します（表示される画像は従来どおり元サイズ）。R2 からの応答は必要なヘッダーだけを通し（Cookie などは捨てる）、CSP の `sandbox` を付けて、アップロードされたファイルがサイト上でスクリプトとして動かないようにしています。AdSense のスクリプトは広告枠のあるページでだけ読み込みます。
- **その他の修正**: アイキャッチ画像がない記事で `src="null"` や `og:image` が壊れていた問題、トップページの著者リンク（`/author/` が抜けていた）、`className` に `false` が入る問題を修正しました。
- 使われていなかった `/api/hello`・`/api/posts` と `ArticleSidebar` を削除しました。
