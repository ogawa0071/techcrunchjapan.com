// D1 bills (and waits for) every row a query reads. With 20,000 posts, a page must only
// read about the rows it shows: an index or join-order regression (e.g. scanning all
// posts to avoid sorting one page) fails here.
import { fileURLToPath } from 'node:url'

import { drizzle, type AnyD1Database } from 'drizzle-orm/d1'
import { migrate } from 'drizzle-orm/d1/migrator'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { getPlatformProxy } from 'wrangler'

import * as q from '../src/server/queries.server'

const root = new URL('..', import.meta.url)
const POSTS = 20_000

let proxy: Awaited<ReturnType<typeof getPlatformProxy<{ DB: AnyD1Database }>>>
let DB: AnyD1Database

interface Statement {
  sql: string
  params: unknown[]
}

/** A D1 binding that records the statements drizzle runs. */
function recordingD1(target: AnyD1Database, log: Statement[]) {
  const wrap = (sql: string, stmt: D1PreparedLike, params: unknown[] = []) => ({
    statement: { sql, params },
    inner: stmt,
    bind: (...values: unknown[]) => wrap(sql, stmt.bind(...values), values),
    raw: (options?: unknown) => {
      log.push({ sql, params })
      return stmt.raw(options)
    },
    all: () => {
      log.push({ sql, params })
      return stmt.all()
    },
  })
  return {
    prepare: (sql: string) => wrap(sql, target.prepare(sql)),
    batch: (statements: ReturnType<typeof wrap>[]) => {
      log.push(...statements.map((s) => s.statement))
      return target.batch(statements.map((s) => s.inner))
    },
  }
}

type D1PreparedLike = ReturnType<AnyD1Database['prepare']>

/**
 * Rows read by the statements that `run` sends to D1, and their query plans
 * (EXPLAIN QUERY PLAN), one string per statement.
 */
async function measure(run: (db: q.Database) => Promise<unknown>) {
  const log: Statement[] = []
  await run(drizzle(recordingD1(DB, log)))
  const [results, plans] = await Promise.all([
    Promise.all(
      log.map(({ sql, params }) =>
        DB.prepare(sql)
          .bind(...params)
          .all(),
      ),
    ),
    Promise.all(
      log.map(({ sql, params }) =>
        DB.prepare(`EXPLAIN QUERY PLAN ${sql}`)
          .bind(...params)
          .all(),
      ),
    ),
  ])
  return {
    rowsRead: results.reduce(
      (sum: number, result: { meta: { rows_read: number } }) =>
        sum + result.meta.rows_read,
      0,
    ),
    plan: plans
      .map((plan: { results: { detail: string }[] }) =>
        plan.results.map((step) => step.detail).join('\n'),
      )
      .join('\n'),
  }
}

beforeAll(async () => {
  proxy = await getPlatformProxy<{ DB: AnyD1Database }>({
    configPath: fileURLToPath(new URL('wrangler.jsonc', root)),
    persist: false,
    remoteBindings: false,
  })
  DB = proxy.env.DB
  await migrate(drizzle(DB), {
    migrationsFolder: fileURLToPath(new URL('drizzle', root)),
  })
  // CAST: D1 binds JavaScript numbers as REAL.
  await DB.batch([
    DB.prepare(
      `INSERT INTO authors (id, slug, name) WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 50)
       SELECT i, 'author-' || i, 'Author ' || i FROM n`,
    ),
    DB.prepare(
      `INSERT INTO categories (id, slug, name) WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 10)
       SELECT i, 'category-' || i, 'Category ' || i FROM n`,
    ),
    DB.prepare(
      `INSERT INTO tags (id, slug, name) WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 500)
       SELECT i, 'tag-' || i, 'Tag ' || i FROM n`,
    ),
    DB.prepare(
      `INSERT INTO posts (id, slug, title, search_title, content, excerpt, author_id, created_at, updated_at)
       WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < CAST(?1 AS INTEGER))
       SELECT i, 'post-' || i, 'Post ' || i || CASE WHEN i % 10 = 0 THEN ' funding' ELSE '' END,
              'post ' || i || CASE WHEN i % 10 = 0 THEN ' funding' ELSE '' END,
              '<p>' || hex(randomblob(500)) || '</p>', 'excerpt', i % 50 + 1,
              1262304000000 + i * 3600000, 1262304000000 + i * 3600000
       FROM n`,
    ).bind(POSTS),
    // Category 1 holds every other post, category 10 only a few.
    DB.prepare(
      `INSERT INTO post_categories (post_id, category_id, post_created_at)
       SELECT id, CASE WHEN id % 2 = 0 THEN 1 WHEN id % 997 = 0 THEN 10 ELSE id % 8 + 2 END, created_at FROM posts`,
    ),
    DB.prepare(
      `INSERT INTO post_tags (post_id, tag_id, post_created_at) SELECT id, id % 500 + 1, created_at FROM posts`,
    ),
  ])
}, 60_000)

afterAll(async () => {
  await proxy?.dispose()
})

// rows_read counts index entries but not table rows fetched through a non-covering index,
// so each case also names the (covering) index that the page of ids must come from.
it.each([
  [
    'home, page 1',
    300,
    'SCAN posts USING COVERING INDEX posts_created_at_id_search_title_idx',
    (db: q.Database) => q.getLatestPosts(db, 1),
  ],
  [
    'home, page 10',
    500,
    'SCAN posts USING COVERING INDEX posts_created_at_id_search_title_idx',
    (db: q.Database) => q.getLatestPosts(db, 10),
  ],
  [
    'big category, page 1',
    300,
    'SEARCH post_categories USING COVERING INDEX post_categories_category_id_post_created_at_post_id_idx',
    (db: q.Database) => q.getCategoryPosts(db, 'category-1', 1),
  ],
  [
    'small category, page 1',
    300,
    'SEARCH post_categories USING COVERING INDEX post_categories_category_id_post_created_at_post_id_idx',
    (db: q.Database) => q.getCategoryPosts(db, 'category-10', 1),
  ],
  [
    'tag, page 1',
    300,
    'SEARCH post_tags USING COVERING INDEX post_tags_tag_id_post_created_at_post_id_idx',
    (db: q.Database) => q.getTagPosts(db, 'tag-7', 1),
  ],
  [
    'author, page 1',
    300,
    'SEARCH posts USING COVERING INDEX posts_author_id_created_at_id_idx',
    (db: q.Database) => q.getAuthorPosts(db, 'author-3', 1),
  ],
  [
    'search, frequent word',
    600,
    'SCAN posts USING COVERING INDEX posts_created_at_id_search_title_idx',
    (db: q.Database) => q.searchPosts(db, 'funding', 1),
  ],
  [
    'article',
    50,
    'SEARCH posts USING INDEX sqlite_autoindex_posts_1 (slug=?)',
    (db: q.Database) => q.getPostBySlug(db, 'post-12345'),
  ],
] as const)('%s: at most %i rows read', async (_label, limit, index, run) => {
  const { rowsRead, plan } = await measure(run)
  expect(rowsRead).toBeLessThanOrEqual(limit)
  expect(plan).toContain(index)
  // The page of ids drives the lookups (no walk over every post in date order).
  expect(plan).not.toContain('BLOOM FILTER')
})

it('scans at most the title index for a word that matches nothing', async () => {
  const { rowsRead, plan } = await measure((db) => q.searchPosts(db, 'zzz', 1))
  expect(rowsRead).toBeLessThanOrEqual(POSTS + 50)
  expect(plan).toContain(
    'SCAN posts USING COVERING INDEX posts_created_at_id_search_title_idx',
  )
})
