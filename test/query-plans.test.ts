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

/** Rows read by the statements that `run` sends to D1. */
async function rowsRead(run: (db: q.Database) => Promise<unknown>) {
  const log: Statement[] = []
  await run(drizzle(recordingD1(DB, log)))
  const results = await Promise.all(
    log.map(({ sql, params }) =>
      DB.prepare(sql)
        .bind(...params)
        .all(),
    ),
  )
  return results.reduce(
    (sum: number, result: { meta: { rows_read: number } }) =>
      sum + result.meta.rows_read,
    0,
  )
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

it.each([
  ['home, page 1', 300, (db: q.Database) => q.getLatestPosts(db, 1)],
  ['home, page 10', 500, (db: q.Database) => q.getLatestPosts(db, 10)],
  [
    'big category, page 1',
    300,
    (db: q.Database) => q.getCategoryPosts(db, 'category-1', 1),
  ],
  [
    'small category, page 1',
    300,
    (db: q.Database) => q.getCategoryPosts(db, 'category-10', 1),
  ],
  ['tag, page 1', 300, (db: q.Database) => q.getTagPosts(db, 'tag-7', 1)],
  [
    'author, page 1',
    300,
    (db: q.Database) => q.getAuthorPosts(db, 'author-3', 1),
  ],
  [
    'search, frequent word',
    600,
    (db: q.Database) => q.searchPosts(db, 'funding', 1),
  ],
  ['article', 50, (db: q.Database) => q.getPostBySlug(db, 'post-12345')],
] as const)('%s: at most %i rows read', async (_label, limit, run) => {
  expect(await rowsRead(run)).toBeLessThanOrEqual(limit)
})

it('scans at most the title index for a word that matches nothing', async () => {
  expect(
    await rowsRead((db) => q.searchPosts(db, 'zzz', 1)),
  ).toBeLessThanOrEqual(POSTS + 50)
})
