# TechCrunch Japan Archive

[techcrunchjapan.com](https://techcrunchjapan.com) — TechCrunch Japan（2006〜2022年）の記事アーカイブです。

## 構成

| 役割                            | 使用技術                                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| ホスティング                    | [Cloudflare Workers](https://developers.cloudflare.com/workers/)（静的ファイルは Static Assets）         |
| フレームワーク                  | [TanStack Start](https://tanstack.com/start) (React 19) + Vite 8                                         |
| データベース                    | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)                                          |
| ORM / マイグレーション          | [Drizzle ORM](https://orm.drizzle.team) / drizzle-kit（1.0 の RC 版）。マイグレーションの適用は wrangler |
| Lint / Format                   | [Oxc](https://oxc.rs)（oxlint / oxfmt）                                                                  |
| テスト / 型チェック             | Vitest / TypeScript 7                                                                                    |
| 画像（`/wp-content/uploads/*`） | R2（`r2.techcrunchjapan.com`）を Worker がプロキシ                                                       |
| パッケージマネージャ            | Bun                                                                                                      |

```
src/
  server.ts            Worker のエントリ（旧 URL のリダイレクト、画像プロキシ、エッジキャッシュ）
  router.tsx           ルーター設定
  routes/              ページ（ファイルベースルーティング）
  components/          UI（旧 WordPress テーマのマークアップ / CSS を踏襲）
  server/functions.ts  サーバー関数（ページのデータ取得。クライアント遷移時は GET /_serverFn/…）
  server/*.server.ts   DB アクセス（サーバー専用）
  db/schema.ts         Drizzle スキーマ
  lib/                 日付・URL・スラッグ・検索・SEO などの共通処理
drizzle/               マイグレーション SQL（drizzle-kit で生成）
scripts/               TiDB → D1 のデータ移行、サイトマップ生成
test/                  ローカルの D1 を使ったクエリのテスト、マイグレーションの確認
public/                静的ファイル（テーマ CSS・画像、サイトマップ、ads.txt、robots.txt、_headers）
```

## 開発

必要なもの: [Bun](https://bun.sh)、Node.js 22.12 以上（推奨 24）。データベースのサーバーは不要です（ローカルの D1 は `.wrangler/state` に保存されます）。

```bash
bun install
```

ローカルの D1 にテーブルを作成します。

```bash
bun run db:migrate
```

記事データは TiDB（同じスキーマの MySQL でも可）からコピーします（`SOURCE_DATABASE_URL` は `.env` に書いても構いません。`.env.example` 参照）。

```bash
SOURCE_DATABASE_URL="mysql://USER:PASSWORD@HOST:4000/DB" bun run db:copy-from-tidb
```

開発サーバーを起動します。

```bash
bun run dev
```

本番のデータで動かしたいときは、`wrangler.jsonc` の D1 バインディングに一時的に `"remote": true` を付けると、開発サーバーが本番の D1 を読みます（`bunx wrangler login` が必要です。アプリは DB に書き込みません）。この変更はコミットしないでください。

ローカルの D1 は `wrangler.jsonc` の `database_id` ごとに別のファイルです。本番の `database_id` を設定する（本番環境の構築の手順 2）と、ローカルは空のデータベースに切り替わるので、`bun run db:migrate` と記事データのコピーをやり直してください。本番環境を先に作ってから、ローカルの準備をすると一度で済みます。

### コマンド

| コマンド                       | 内容                                                                  |
| ------------------------------ | --------------------------------------------------------------------- |
| `bun run dev`                  | 開発サーバー（Worker は workerd 上で動作）                            |
| `bun run build`                | 本番ビルド（`dist/`）                                                 |
| `bun run preview`              | 本番ビルドをローカルの workerd で実行                                 |
| `bun run deploy`               | ビルドして Cloudflare にデプロイ                                      |
| `bun run check`                | 型チェック・lint・フォーマット・テストをまとめて実行                  |
| `bun run typecheck`            | `wrangler types`（`worker-configuration.d.ts` の生成）+ `tsc -b`      |
| `bun run lint` / `bun run fmt` | oxlint / oxfmt                                                        |
| `bun run test`                 | Vitest（単体テストと、ローカルの D1 を使ったクエリのテスト）          |
| `bun run db:generate`          | `src/db/schema.ts` の変更からマイグレーション SQL を生成              |
| `bun run db:migrate`           | マイグレーションをローカルの D1 に適用（`--remote` を付けると本番）   |
| `bun run db:studio`            | Drizzle Studio（ローカルの D1）                                       |
| `bun run db:copy-from-tidb`    | TiDB から D1 へデータをコピー（`--remote` を付けると本番。後述）      |
| `bun run sitemap`              | `public/` のサイトマップを D1 から再生成（`--remote` を付けると本番） |

`.env` は scripts/ のスクリプト、drizzle-kit、wrangler / Vite（開発サーバー）がそれぞれ読み込みます。Worker には渡りません。scripts/ のスクリプトは Node.js（tsx）で実行します（wrangler のリモートバインディングが Bun では動かないため。`bun run` から実行すれば意識する必要はありません）。

本番の D1 の中身を見るには、`bunx wrangler d1 execute DB --remote --command "SELECT …"` か、Cloudflare ダッシュボードの D1 のコンソールを使います（Drizzle Studio はローカル専用です。Studio のローカルサーバーはどの Web ページからの SQL も受け付けるため、本番には向けません）。

## 本番環境の構築（初回のみ）

1. **Workers Paid プラン**にします（[プラン](#プラン)を参照。D1 の容量と書き込み行数のため必要です）。
2. **D1 データベースの作成**: 読者の多いアジア太平洋に作成し、表示された `database_id` を `wrangler.jsonc` の `d1_databases[0].database_id` に貼り付けます（wrangler に設定ファイルを書き換えさせると、別のバインディングが追記され、書式も変わるため、`--no-update-config` を付けています）。ローカルの D1 はここで空のデータベースに切り替わります（[開発](#開発)を参照）。

   ```bash
   bunx wrangler login
   ```

   ```bash
   bunx wrangler d1 create techcrunchjapan --location apac --no-update-config
   ```

3. **テーブル作成**:

   ```bash
   bun run db:migrate --remote
   ```

4. **データ移行**: TiDB から D1 にデータをコピーします。
   - 100 件ずつ（`BATCH_SIZE` で変更可）、記事とそのカテゴリ・タグの関連を 1 つの D1 バッチ（トランザクション）で書き込みます。主キーで upsert するので、途中で止まっても再実行できます。変更のない行は書き換えないので、D1 の書き込み行数にも数えられません。
   - 本文はバインド変数で送るので、SQL 文の 100 KB の制限は受けません。D1 の 1 行 2 MB の上限を超える記事はスキップして一覧を表示し、終了コード 1 で終わります。
   - 最後に移行元と移行先の件数を照合し、合わなければ終了コード 1 で終わります。
   - TiDB への接続は TLS（証明書とホスト名を検証）です。
   - 本番の D1 には wrangler の「リモートバインディング」で接続します（`bunx wrangler login` のセッション、または `.env` の `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID`）。接続のために一時的なプレビュー用 Worker（`techcrunchjapan-scripts`）がアップロードされます。
   - 本番の D1 はドメインを切り替えるまでどこからも使われないので、失敗しても直して再実行すれば済みます。最初からやり直す場合は、`bunx wrangler d1 delete techcrunchjapan` で削除して手順 2 から作り直します。

   ```bash
   SOURCE_DATABASE_URL="mysql://USER:PASSWORD@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/DB" bun run db:copy-from-tidb --remote
   ```

5. **読み取りレプリカ**（任意）: Cloudflare ダッシュボードで D1 のデータベースの設定から Read replication を有効にすると、各地域のレプリカが読み取りに応答するようになります（追加料金なし）。アプリは D1 の Sessions API（`withSession`）経由で問い合わせているので、設定を変えるだけで使われます。
6. **デプロイ**して `*.workers.dev` で動作を確認します。

   ```bash
   bun run deploy
   ```

7. **ドメインの切り替え**:
   1. Cloudflare DNS にある Vercel 向けのレコード（`techcrunchjapan.com` と `www.techcrunchjapan.com`）を削除します。
   2. `wrangler.jsonc` の `routes`（カスタムドメイン）のコメントを外し、`workers_dev` を `false` にして再度デプロイします。DNS レコードと証明書は Cloudflare が作成します。
   3. www は Worker に割り当てず、ゾーンの Redirect Rules で `www.techcrunchjapan.com/*` を `https://techcrunchjapan.com/${1}`（301、クエリ文字列を保持）へ転送します。www には転送用の DNS レコード（プロキシ有効の `AAAA 100::` など）が必要です。
   4. Vercel で自動だった HTTPS への転送と HSTS は、Worker が HTTP のアクセスを HTTPS へリダイレクトし、`Strict-Transport-Security` ヘッダーを付けることで引き継いでいます。静的ファイルも含めて確実にするため、ゾーン設定の「Always Use HTTPS」も有効にしてください。
   5. ゾーンのセキュリティ設定（Bot Fight Mode など）が `r2.techcrunchjapan.com` へのアクセスにチャレンジを出していないか確認します（Worker が画像を取得できなくなります）。
   6. 最後に Vercel のプロジェクトを削除します。

8. **サイトマップの再生成**（任意）: 本番の D1 から `lastmod` 付きのサイトマップを作り直してコミットします。

   ```bash
   bun run sitemap --remote
   ```

9. 動作を確認したら、TiDB のクラスタを削除します。D1 は Time Travel で過去 30 日の任意の時点に戻せます（`bunx wrangler d1 time-travel`）。

Git 連携の [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) を使う場合は、ビルドコマンドを `bun run build`、デプロイコマンドを `bunx wrangler deploy` にします（Bun のバージョンは `package.json` の `packageManager` で固定しています）。main 以外のブランチのビルドは既定で `npx wrangler preview` で Preview を作ります。Preview は本番と同じ D1・レート制限・変数を使います（`vite.config.ts` で本番の設定を `previews` にコピーしています）。

### プラン

**Workers Paid プラン**（月 5 ドル〜）が必要です。

- **D1**: 無料プランは 1 データベース 500 MB まで、書き込みは 1 日 10 万行、読み取りは 1 日 500 万行までです。SQLite は本文を圧縮しないため、TiDB で約 500 MB のデータは上限を超えるか、ぎりぎりになります（合成データの記事 6.5 万件では、本文と抜粋の合計 約 170 MB に対してデータベースは約 290 MB になりました）。インデックスへの書き込みも行数に数えられ（記事 1 件で 4 行）、データ移行だけで無料枠の数日分になります。上限に達すると、その日（UTC）のうちはキャッシュにないページを表示できなくなります。Paid プランは 1 データベース 10 GB まで、毎月 250 億行の読み取り、5,000 万行の書き込み、5 GB のストレージが料金に含まれ、通常のアクセスなら追加料金はかかりません。ただし、どの記事にもヒットしない検索や深いページは 1 回で最大約 6.5 万行を読みます（含まれる枠で約 38 万回分、超えると 100 万回あたり約 65 ドル）。これらは D1 を一度に 1 つずつ処理するため、大量に送られるとサイト全体の表示も遅くなります。そのため件数を制限しています（[データベース（D1）](#データベースd1)）。念のため Cloudflare の請求の通知（Billing notifications）も設定しておくと安心です。
- **CPU 時間**: 無料プランは 1 リクエストあたり 10ms で、キャッシュされていない長い記事のレンダリングが上限を超えることがあります（Error 1102）。データベースへのアクセス待ちは CPU 時間に含まれません。

## データベース（D1）

D1 は読み取った行数で課金され、その分だけ時間もかかるため、どのページも表示する行に近い数だけを読むようにしています。`test/query-plans.test.ts` で上限を確認しています。

- 一覧は記事の日付順のインデックスを読み、1 ページ分で止まります。カテゴリ・タグの一覧のため、関連テーブル（`post_categories` / `post_tags`）に記事の日付を複製しています（アーカイブは更新されないため、データ移行で書き込むだけです）。
- 1 ページの表示は D1 への問い合わせ 1 回です。各記事のカテゴリは JSON で同時に取得し、カテゴリ・タグ・著者のページは項目と記事一覧を `db.batch` でまとめて取得します。
- 合成データ（記事 6.5 万件）での読み取り行数は、記事ページが 6 行、各一覧の 1 ページ目が約 200 行です。ページを深くたどるほど読み飛ばす行が増え、トップの最終ページで約 6.5 万行です。
- タイトル検索は、Unicode の正規化（NFKC）と小文字化をしたタイトル（`posts.search_title`）を `instr()` で部分一致検索します。全角・半角や大文字・小文字の違いは無視されます。D1 の `LIKE` はパターンが 50 バイト（日本語で約 16 文字）までのため使っていません。どの記事にもヒットしない語では、全記事分のタイトルのインデックス（約 6.5 万行）を読みます。
- キャッシュにない検索と、50 ページ目以降の一覧は、Workers の [Rate Limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) で件数を制限しています。1 つの IP アドレス（IPv6 は /64）から 1 分あたり 20 回、全体で 1 分あたり 60 回（いずれも Cloudflare のデータセンターごと）までで、超えると 429 を返します（エッジにはキャッシュしません）。IP ごとの上限を超えたリクエストは全体の回数に数えないので、1 つのクライアント（クローラーなど）が送り続けても、ほかの人の検索は止まりません。上限は `wrangler.jsonc` の `ratelimits` で変えられます。
- 外部キーに `ON DELETE CASCADE` は付けていません。D1 ではマイグレーション中に外部キーを無効にできず、drizzle-kit がテーブルを作り直すマイグレーション（親テーブルの `DROP TABLE`）で関連の行がすべて消えてしまうためです。そうしたマイグレーションでは、drizzle-kit が作り直すテーブルごとに書く `PRAGMA foreign_keys=OFF;` をすべて `PRAGMA defer_foreign_keys = ON;` に、`PRAGMA foreign_keys=ON;` をすべて `PRAGMA defer_foreign_keys = OFF;` に書き換え（書き換え漏れは `test/migrations.test.ts` が検出します）、適用後に `bunx wrangler d1 execute DB --command "PRAGMA foreign_key_check"`（本番は `--remote` も）が何も返さないことを確認してください。書き換えなかった場合はマイグレーションが失敗するだけで、データは消えません。
- マイグレーションは wrangler が `d1_migrations` テーブルで管理します。`drizzle-kit migrate` / `push` は別の記録を使うので併用しないでください。
- Drizzle は 1.0 の RC 版（`1.0.0-rc.5`）を、`drizzle-orm` と `drizzle-kit` で同じバージョンに固定しています。

## キャッシュ

- **静的ファイル**（`public/`、ビルド済み JS / CSS）は Worker を通らずに配信されます。キャッシュ期間は `public/_headers` で指定しています。
- **ページと、クライアント遷移時のデータ（GET `/_serverFn/…`）** は、既定では Worker が Cache API でデータセンターごとに 30 日間キャッシュします（旧 ISR の `revalidate` と同じ）。404 は 1 日です。キャッシュキーにデプロイのバージョンを含めているため、デプロイすると新しいキャッシュに切り替わります。レスポンスヘッダー `X-Edge-Cache` で HIT / MISS を確認できます。ブラウザには毎回再検証させます（`Cache-Control: max-age=0`）。
- Workers Paid プランなら Cloudflare の [Workers Cache](https://developers.cloudflare.com/workers/cache/) への切り替えをおすすめします。ヒット時は Worker を実行せずに階層型の共有キャッシュから返し、期限切れのページは裏で再生成されます（ISR と同じ動き）。`wrangler.jsonc` の `"cache": { "enabled": true }` のコメントを外し、`vars.EDGE_CACHE` を `"none"` にします。Worker はそのためのヘッダー（`Cloudflare-CDN-Cache-Control`）を常に付けています。注意点: Workers Cache を有効にすると静的ファイルへのリクエストも Worker のリクエストとして課金されます。また、キャッシュのキーはパスとクエリ文字列そのもの（ホストは含まない）なので、`utm_*` などが付いたアクセスは別エントリになり、www や HTTP の転送はゾーンのルール（上記）で行う必要があります。
- **画像**（`/wp-content/uploads/*`）は R2 から取得し、Cloudflare のキャッシュに 1 年間（404 は 1 日）保存します。

## 旧構成（Vercel + Next.js + TiDB + Prisma）からの変更点

- **superjson / babel-plugin-superjson-next**: Next.js の `getStaticProps` が `Date` を返せないため、Prisma の `Date` をページに渡す用途で使われていました。TanStack Start のサーバー関数とローダーは `Date` をそのまま受け渡しできるので削除しました。
- **jsdom**: 記事一覧の抜粋と meta description 用に、本文 HTML からテキストを取り出すのに使われていました。抜粋はデータ移行時に計算して `posts.excerpt` に保存するようにしたので（`scripts/lib/excerpt.ts`、htmlparser2 を使用）、実行時の HTML パースは不要になりました。
- **ESLint / Prettier** → oxlint / oxfmt。**Prisma** → Drizzle。**TiDB (MySQL)** → Cloudflare D1。データの読み書きが Cloudflare の中で完結し、接続文字列や DB サーバーの管理が不要になりました。
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
