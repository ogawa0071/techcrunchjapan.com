/**
 * One-off data migration: TiDB (MySQL, old Prisma schema) → Cloudflare D1 (Drizzle schema).
 *
 *   1. Create the tables:  bun run db:migrate [--remote]
 *   2. Copy the data:      SOURCE_DATABASE_URL=mysql://... bun run db:copy-from-tidb [--remote]
 *
 * Without --remote, the local database of `bun run dev` (.wrangler/state) is filled; with
 * --remote, the production database of wrangler.jsonc (see scripts/lib/d1.ts).
 *
 * - Each batch of posts is written together with its category / tag links by one D1 batch,
 *   which D1 runs as a transaction. Values are bound as parameters (SQL text is limited to
 *   100 KB per statement, article HTML can be longer).
 * - Rows are upserted by primary key and only changed rows are rewritten (D1 bills rows
 *   written), so the script can be re-run safely, e.g. after an interruption.
 * - `posts.excerpt` (plain-text lead used for listings and meta descriptions) is computed
 *   here, which is why the app itself needs no HTML parser (formerly jsdom), and so is
 *   `posts.search_title` (the title as compared by the search).
 * - D1 rows are limited to 2 MB: larger posts (and their links) are skipped and reported.
 * - The run fails (exit code 1) when posts were skipped or the copied row counts differ
 *   from the expected ones.
 *
 * Environment: SOURCE_DATABASE_URL, BATCH_SIZE (posts per batch, default 100).
 */
import { count, getTableColumns, getTableName, sql } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core'
import mysql, { type RowDataPacket } from 'mysql2/promise'

import * as schema from '../src/db/schema'
import { toSearchText } from '../src/lib/search'
import { connectD1, type D1Connection } from './lib/d1'
import { describeError } from './lib/errors'
import { toExcerpt } from './lib/excerpt'

/** D1 binds at most 100 parameters per statement. */
const MAX_PARAMS = 100
/** D1 limits every string, BLOB and row to 2,000,000 bytes. */
const MAX_ROW_BYTES = 2_000_000
/** Approximate bound on the values sent with one D1 batch (one request with --remote). */
const MAX_BATCH_BYTES = 4_000_000
const MAX_BATCH_SIZE = 1_000

type Db = DrizzleD1Database
type Statement = BatchItem<'sqlite'>

interface SourceTerm extends RowDataPacket {
  id: number
  slug: string
  name: string
  description: string | null
}

interface SourcePost extends RowDataPacket {
  id: number
  slug: string
  createdAt: Date
  updatedAt: Date
  title: string
  content: string
  authorId: number
  featuredMediaUrl: string | null
}

interface SourceLink extends RowDataPacket {
  postId: number
  termId: number
}

interface SourceCount extends RowDataPacket {
  /** COUNT(*) is a BIGINT, which mysql2 may return as a string. */
  count: number | string
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Environment variable ${name} is required`)
  return value
}

function batchSize(): number {
  const raw = process.env.BATCH_SIZE
  if (!raw) return 100
  const size = Number(raw)
  if (!Number.isInteger(size) || size < 1 || size > MAX_BATCH_SIZE) {
    throw new Error(`BATCH_SIZE must be an integer from 1 to ${MAX_BATCH_SIZE}`)
  }
  return size
}

/** Builds mysql2 options from a URL, ignoring Prisma-specific query params such as `sslaccept`. */
function mysqlOptions(url: string): mysql.ConnectionOptions {
  const u = new URL(url)
  const host = u.hostname.replace(/^\[|\]$/g, '') // IPv6 literals come bracketed
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(host)
  return {
    host,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: decodeURIComponent(u.pathname.slice(1)),
    // Prisma stores DATETIME columns in UTC.
    timezone: 'Z',
    // TiDB Cloud only accepts TLS connections; verify the certificate and the host name.
    ssl: isLocal
      ? undefined
      : {
          minVersion: 'TLSv1.2',
          rejectUnauthorized: true,
          verifyIdentity: true,
        },
  }
}

async function countSourceRows(
  connection: mysql.Connection,
  query: string,
): Promise<number> {
  const [rows] = await connection.query<SourceCount[]>(query)
  return Number(rows[0]?.count ?? 0)
}

/** NUL characters are dropped, as before: SQLite's string functions stop at them. */
const clean = (value: string) => value.replaceAll('\0', '')
const cleanNullable = (value: string | null) =>
  value === null ? null : clean(value)

const byteLength = (value: string | null) =>
  value === null ? 0 : Buffer.byteLength(value)

/**
 * `ON CONFLICT DO UPDATE` that only rewrites rows whose values changed: re-runs then
 * write (and are billed for) changed rows only.
 */
function upsertChanged(table: SQLiteTable, primaryKey: SQLiteColumn[]) {
  const keys = new Set(primaryKey.map((column) => column.name))
  const columns = Object.entries(getTableColumns(table)).filter(
    ([, column]) => !keys.has(column.name),
  )
  const current = columns
    .map(([, column]) => `"${getTableName(table)}"."${column.name}"`)
    .join(', ')
  const incoming = columns
    .map(([, column]) => `excluded."${column.name}"`)
    .join(', ')
  return {
    target: primaryKey,
    set: Object.fromEntries(
      columns.map(([key, column]) => [
        key,
        sql.raw(`excluded."${column.name}"`),
      ]),
    ),
    setWhere: sql.raw(`(${current}) IS NOT (${incoming})`),
  }
}

/** Rows per INSERT: D1 binds at most 100 parameters per statement. */
function rowsPerStatement(table: SQLiteTable): number {
  return Math.floor(MAX_PARAMS / Object.keys(getTableColumns(table)).length)
}

function* chunks<T>(items: T[], size: number): Generator<T[]> {
  for (let i = 0; i < items.length; i += size) yield items.slice(i, i + size)
}

/** Groups consecutive items into chunks of at most `maxCount` items and `maxBytes` bytes. */
function* chunksBySize<T>(
  items: T[],
  maxCount: number,
  maxBytes: number,
  size: (item: T) => number,
): Generator<T[]> {
  let chunk: T[] = []
  let bytes = 0
  for (const item of items) {
    const itemBytes = size(item)
    if (
      chunk.length > 0 &&
      (chunk.length >= maxCount || bytes + itemBytes > maxBytes)
    ) {
      yield chunk
      chunk = []
      bytes = 0
    }
    chunk.push(item)
    bytes += itemBytes
  }
  if (chunk.length > 0) yield chunk
}

interface SizedStatement {
  statement: Statement
  bytes: number
}

/**
 * Runs the statements in order, in as few D1 batches as the size bound allows. A batch is
 * a transaction; a failure leaves the earlier batches applied, which re-runs repair.
 */
async function runInBatches(db: Db, statements: SizedStatement[]) {
  for (const group of chunksBySize(
    statements,
    Number.POSITIVE_INFINITY,
    MAX_BATCH_BYTES,
    (item) => item.bytes,
  )) {
    const [first, ...rest] = group.map((item) => item.statement)
    if (first) await db.batch([first, ...rest])
  }
}

async function copyTerms(
  source: mysql.Connection,
  db: Db,
  from: string,
  to: typeof schema.authors | typeof schema.categories | typeof schema.tags,
): Promise<Set<number>> {
  const [rows] = await source.query<SourceTerm[]>(
    `SELECT id, slug, name, description FROM \`${from}\` ORDER BY id`,
  )
  const values = rows.map((row) => ({
    id: row.id,
    slug: clean(row.slug),
    name: clean(row.name),
    description: cleanNullable(row.description),
  }))
  const statements: SizedStatement[] = []
  for (const chunk of chunks(values, rowsPerStatement(to))) {
    statements.push({
      statement: db
        .insert(to)
        .values(chunk)
        .onConflictDoUpdate(upsertChanged(to, [to.id])),
      bytes: chunk.reduce(
        (sum, row) =>
          sum +
          byteLength(row.slug) +
          byteLength(row.name) +
          byteLength(row.description),
        0,
      ),
    })
  }
  await runInBatches(db, statements)
  console.log(`${from} → ${getTableName(to)}: ${rows.length} rows`)
  return new Set(rows.map((row) => row.id))
}

interface Link {
  postId: number
  termId: number
}

async function main() {
  const size = batchSize()
  const sourceUrl = requireEnv('SOURCE_DATABASE_URL')
  let target: D1Connection | undefined
  let source: mysql.Connection | undefined
  try {
    target = await connectD1()
    source = await mysql.createConnection(mysqlOptions(sourceUrl))
    const from = new URL(sourceUrl)
    console.log(
      `Copying ${from.host}${from.pathname} (MySQL) to the ${target.target}`,
    )
    await copy(source, target.db, size)
  } finally {
    await source?.end().catch(() => {})
    await target?.close().catch(() => {})
  }
}

async function copy(source: mysql.Connection, db: Db, size: number) {
  const started = performance.now()

  // --- authors / categories / tags (small tables) ----------------------------------------
  const authorIds = await copyTerms(source, db, 'User', schema.authors)
  const categoryIds = await copyTerms(source, db, 'Category', schema.categories)
  const tagIds = await copyTerms(source, db, 'Tag', schema.tags)

  // --- posts and their category / tag links, keyset-paginated by id -----------------------
  const totalPosts = await countSourceRows(
    source,
    'SELECT COUNT(*) AS count FROM `Post`',
  )
  const placeholderAuthors: number[] = []
  const oversized: { id: number; bytes: number }[] = []
  const skipped = {
    categoryLinks: 0,
    tagLinks: 0,
    oversizedCategoryLinks: 0,
    oversizedTagLinks: 0,
  }
  const postRows = rowsPerStatement(schema.posts)
  const linkRows = rowsPerStatement(schema.postCategories)
  let copiedPosts = 0
  let lastId = 0
  for (;;) {
    const [rows] = await source.query<SourcePost[]>(
      'SELECT id, slug, createdAt, updatedAt, title, content, authorId, featuredMediaUrl FROM `Post` WHERE id > ? ORDER BY id LIMIT ?',
      [lastId, size],
    )
    if (rows.length === 0) break
    const postIds = rows.map((row) => row.id)
    const [categoryLinks] = await source.query<SourceLink[]>(
      'SELECT postId, categoryId AS termId FROM `CategoriesOnPosts` WHERE postId IN (?) ORDER BY postId, categoryId',
      [postIds],
    )
    const [tagLinks] = await source.query<SourceLink[]>(
      'SELECT postId, tagId AS termId FROM `TagsOnPosts` WHERE postId IN (?) ORDER BY postId, tagId',
      [postIds],
    )

    const posts = rows.map((row) => ({
      id: row.id,
      slug: clean(row.slug),
      title: clean(row.title),
      searchTitle: toSearchText(clean(row.title)),
      content: clean(row.content),
      excerpt: clean(toExcerpt(row.content)),
      featuredMediaUrl: cleanNullable(row.featuredMediaUrl),
      authorId: row.authorId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }))
    const postBytes = (post: (typeof posts)[number]) =>
      byteLength(post.slug) +
      byteLength(post.title) +
      byteLength(post.searchTitle) +
      byteLength(post.content) +
      byteLength(post.excerpt) +
      byteLength(post.featuredMediaUrl) +
      64 // numbers and the record header
    const storable = posts.filter((post) => {
      const bytes = postBytes(post)
      if (bytes <= MAX_ROW_BYTES) return true
      oversized.push({ id: post.id, bytes })
      return false
    })
    const createdAt = new Map(storable.map((post) => [post.id, post.createdAt]))

    // The old schema did not always enforce foreign keys: authors may be missing, and
    // links may point to missing terms (those links are dropped and counted).
    const missingAuthors = [
      ...new Set(storable.map((post) => post.authorId)),
    ].filter((id) => !authorIds.has(id))
    const links = (
      found: SourceLink[],
      termIds: Set<number>,
      counts: 'categoryLinks' | 'tagLinks',
    ): Link[] =>
      found.filter((link) => {
        if (!termIds.has(link.termId)) {
          skipped[counts]++
          return false
        }
        if (!createdAt.has(link.postId)) {
          skipped[
            counts === 'categoryLinks'
              ? 'oversizedCategoryLinks'
              : 'oversizedTagLinks'
          ]++
          return false
        }
        return true
      })
    const validCategoryLinks = links(
      categoryLinks,
      categoryIds,
      'categoryLinks',
    )
    const validTagLinks = links(tagLinks, tagIds, 'tagLinks')

    const statements: SizedStatement[] = []
    for (const chunk of chunks(
      missingAuthors,
      rowsPerStatement(schema.authors),
    )) {
      statements.push({
        statement: db
          .insert(schema.authors)
          .values(
            chunk.map((id) => ({
              id,
              slug: `missing-author-${id}`,
              name: `missing-author-${id}`,
            })),
          )
          .onConflictDoNothing({ target: schema.authors.id }),
        bytes: chunk.length * 64,
      })
    }
    for (const chunk of chunksBySize(
      storable,
      postRows,
      MAX_ROW_BYTES,
      postBytes,
    )) {
      statements.push({
        statement: db
          .insert(schema.posts)
          .values(chunk)
          .onConflictDoUpdate(upsertChanged(schema.posts, [schema.posts.id])),
        bytes: chunk.reduce((sum, post) => sum + postBytes(post), 0),
      })
    }
    for (const chunk of chunks(validCategoryLinks, linkRows)) {
      statements.push({
        statement: db
          .insert(schema.postCategories)
          .values(
            chunk.map((link) => ({
              postId: link.postId,
              categoryId: link.termId,
              postCreatedAt: createdAt.get(link.postId)!,
            })),
          )
          .onConflictDoUpdate(
            upsertChanged(schema.postCategories, [
              schema.postCategories.postId,
              schema.postCategories.categoryId,
            ]),
          ),
        bytes: chunk.length * 24,
      })
    }
    for (const chunk of chunks(validTagLinks, linkRows)) {
      statements.push({
        statement: db
          .insert(schema.postTags)
          .values(
            chunk.map((link) => ({
              postId: link.postId,
              tagId: link.termId,
              postCreatedAt: createdAt.get(link.postId)!,
            })),
          )
          .onConflictDoUpdate(
            upsertChanged(schema.postTags, [
              schema.postTags.postId,
              schema.postTags.tagId,
            ]),
          ),
        bytes: chunk.length * 24,
      })
    }

    try {
      await runInBatches(db, statements)
    } catch (error) {
      throw new Error(`Copying posts ${postIds[0]}–${postIds.at(-1)} failed`, {
        cause: error,
      })
    }

    for (const id of missingAuthors) {
      authorIds.add(id)
      placeholderAuthors.push(id)
    }
    copiedPosts += rows.length
    lastId = postIds.at(-1)!
    if (process.stdout.isTTY) {
      process.stdout.write(`\rPost → posts ${copiedPosts}/${totalPosts}`)
    } else if (copiedPosts % (size * 20) === 0) {
      console.log(`Post → posts ${copiedPosts}/${totalPosts}`)
    }
  }
  console.log(
    `${process.stdout.isTTY ? '\n' : ''}Post → posts: ${copiedPosts - oversized.length} rows`,
  )

  // Planner statistics for the new tables (not needed for correctness).
  try {
    await db.run(sql`PRAGMA optimize`)
  } catch (error) {
    console.warn(`PRAGMA optimize failed: ${describeError(error)}`)
  }

  // --- verification ---------------------------------------------------------------------
  // Links whose post does not exist in the source are never selected above.
  const orphanCategoryLinks = await countSourceRows(
    source,
    'SELECT COUNT(*) AS count FROM `CategoriesOnPosts` l LEFT JOIN `Post` p ON p.id = l.postId WHERE p.id IS NULL',
  )
  const orphanTagLinks = await countSourceRows(
    source,
    'SELECT COUNT(*) AS count FROM `TagsOnPosts` l LEFT JOIN `Post` p ON p.id = l.postId WHERE p.id IS NULL',
  )
  const expected = [
    {
      from: 'User',
      to: schema.authors,
      adjust: placeholderAuthors.length,
    },
    { from: 'Category', to: schema.categories, adjust: 0 },
    { from: 'Tag', to: schema.tags, adjust: 0 },
    { from: 'Post', to: schema.posts, adjust: -oversized.length },
    {
      from: 'CategoriesOnPosts',
      to: schema.postCategories,
      adjust:
        -skipped.categoryLinks -
        skipped.oversizedCategoryLinks -
        orphanCategoryLinks,
    },
    {
      from: 'TagsOnPosts',
      to: schema.postTags,
      adjust: -skipped.tagLinks - skipped.oversizedTagLinks - orphanTagLinks,
    },
  ]
  const report = []
  for (const { from, to, adjust } of expected) {
    const sourceCount = await countSourceRows(
      source,
      `SELECT COUNT(*) AS count FROM \`${from}\``,
    )
    const [row] = await db.select({ count: count() }).from(to)
    const targetCount = row?.count ?? 0
    report.push({
      source: from,
      target: getTableName(to),
      sourceCount,
      expected: sourceCount + adjust,
      targetCount,
      ok: targetCount === sourceCount + adjust,
    })
  }
  console.table(report)
  if (placeholderAuthors.length > 0) {
    console.warn(
      `Placeholder authors created for missing ids: ${placeholderAuthors.join(', ')}`,
    )
  }
  const dropped = {
    'links to missing categories': skipped.categoryLinks,
    'links to missing tags': skipped.tagLinks,
    'category links to missing posts': orphanCategoryLinks,
    'tag links to missing posts': orphanTagLinks,
  }
  for (const [what, n] of Object.entries(dropped)) {
    if (n > 0) console.warn(`Dropped ${n} ${what}`)
  }
  if (oversized.length > 0) {
    console.error(
      `Skipped ${oversized.length} posts larger than D1's row limit (${MAX_ROW_BYTES} bytes) and their ${skipped.oversizedCategoryLinks + skipped.oversizedTagLinks} links: ${oversized.map(({ id, bytes }) => `${id} (${bytes} bytes)`).join(', ')}`,
    )
    process.exitCode = 1
  }
  if (report.some((row) => !row.ok)) {
    console.error(
      'Row counts differ from the expected ones (rows from another source in the target database?)',
    )
    process.exitCode = 1
  }
  // Size of the whole database (D1 reports it with every query).
  const { meta } = await db.run(sql`SELECT 1`)
  console.log(
    `D1 database size: ${(meta.size_after / 1e6).toFixed(1)} MB. Done in ${((performance.now() - started) / 1000).toFixed(1)}s`,
  )
}

try {
  await main()
} catch (error) {
  console.error(describeError(error))
  process.exitCode = 1
}
