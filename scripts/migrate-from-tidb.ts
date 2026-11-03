/**
 * One-off data migration: TiDB (MySQL, old Prisma schema) → Neon (PostgreSQL, Drizzle schema).
 *
 *   1. Create the tables:   DATABASE_URL=... bun run db:migrate
 *   2. Copy the data:       SOURCE_DATABASE_URL=mysql://... DATABASE_URL=postgresql://... bun run db:copy-from-tidb
 *
 * - Rows are upserted by primary key and only changed rows are rewritten, so the script
 *   can be re-run safely (e.g. after an interruption). Each batch is one transaction.
 * - `posts.excerpt` (plain-text lead used for listings and meta descriptions) is computed
 *   here, which is why the app itself no longer needs an HTML parser (formerly jsdom).
 * - The run fails (exit code 1) when the copied row counts differ from the expected ones.
 *
 * Environment: SOURCE_DATABASE_URL, DATABASE_URL, BATCH_SIZE (posts per batch, default 500).
 */
import {
  DrizzleQueryError,
  getTableColumns,
  getTableName,
  sql,
} from 'drizzle-orm'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import mysql, { type RowDataPacket } from 'mysql2/promise'
import { Client } from 'pg'

import * as schema from '../src/db/schema'
import { toExcerpt } from './lib/excerpt'

/** The posts insert binds 9 parameters per row; PostgreSQL allows 65,535 per statement. */
const MAX_BATCH_SIZE = Math.floor(65_535 / 9)
/** Link rows bind 2 parameters each. */
const LINK_CHUNK_SIZE = 10_000

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
  if (!raw) return 500
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

/** PostgreSQL text cannot contain NUL characters. */
const clean = (value: string) => value.replaceAll('\0', '')
const cleanNullable = (value: string | null) =>
  value === null ? null : clean(value)

/**
 * `ON CONFLICT DO UPDATE` that only rewrites rows whose values changed, so re-runs do not
 * duplicate every row version (and its TOASTed HTML) in PostgreSQL.
 */
function upsertChanged(table: PgTable, primaryKey: PgColumn) {
  const columns = Object.entries(getTableColumns(table)).filter(
    ([, column]) => column.name !== primaryKey.name,
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
    setWhere: sql.raw(`(${current}) IS DISTINCT FROM (${incoming})`),
  }
}

function* chunks<T>(items: T[], size: number): Generator<T[]> {
  for (let i = 0; i < items.length; i += size) yield items.slice(i, i + size)
}

/**
 * The underlying driver message. Drizzle's own error message contains the whole statement
 * and its parameters (i.e. article HTML), so it is never printed.
 */
function describeError(error: unknown): string {
  let current = error
  while (
    current instanceof DrizzleQueryError &&
    current.cause instanceof Error
  ) {
    current = current.cause
  }
  if (!(current instanceof Error)) return String(current)
  const { code, detail } = current as Error & { code?: string; detail?: string }
  return [current.message, code && `(code ${code})`, detail]
    .filter(Boolean)
    .join(' ')
}

type Db = NodePgDatabase<typeof schema>

async function copyTerms(
  source: mysql.Connection,
  db: Db,
  from: string,
  to: typeof schema.authors | typeof schema.categories | typeof schema.tags,
  size: number,
): Promise<Set<number>> {
  const [rows] = await source.query<SourceTerm[]>(
    `SELECT id, slug, name, description FROM \`${from}\` ORDER BY id`,
  )
  for (const chunk of chunks(rows, size)) {
    await db
      .insert(to)
      .values(
        chunk.map((row) => ({
          id: row.id,
          slug: clean(row.slug),
          name: clean(row.name),
          description: cleanNullable(row.description),
        })),
      )
      .onConflictDoUpdate(upsertChanged(to, to.id))
  }
  console.log(`${from} → ${getTableName(to)}: ${rows.length} rows`)
  return new Set(rows.map((row) => row.id))
}

async function main() {
  const size = batchSize()
  const source = await mysql.createConnection(
    mysqlOptions(requireEnv('SOURCE_DATABASE_URL')),
  )
  const client = new Client({ connectionString: requireEnv('DATABASE_URL') })
  await client.connect()
  const db = drizzle({ client, schema })
  const started = performance.now()

  try {
    // --- authors / categories / tags (small tables) ----------------------------------------
    const authorIds = await copyTerms(source, db, 'User', schema.authors, size)
    const categoryIds = await copyTerms(
      source,
      db,
      'Category',
      schema.categories,
      size,
    )
    const tagIds = await copyTerms(source, db, 'Tag', schema.tags, size)

    // --- posts and their category / tag links, keyset-paginated by id -----------------------
    const totalPosts = await countSourceRows(
      source,
      'SELECT COUNT(*) AS count FROM `Post`',
    )
    const placeholderAuthors: number[] = []
    const skipped = { categoryLinks: 0, tagLinks: 0 }
    let copiedPosts = 0
    let lastId = 0
    for (;;) {
      const [rows] = await source.query<SourcePost[]>(
        'SELECT id, slug, createdAt, updatedAt, title, content, authorId, featuredMediaUrl FROM `Post` WHERE id > ? ORDER BY id LIMIT ?',
        [lastId, size],
      )
      if (rows.length === 0) break
      const postIds = rows.map((row) => row.id)
      const [categoryLinks] = await source.query<RowDataPacket[]>(
        'SELECT postId, categoryId FROM `CategoriesOnPosts` WHERE postId IN (?)',
        [postIds],
      )
      const [tagLinks] = await source.query<RowDataPacket[]>(
        'SELECT postId, tagId FROM `TagsOnPosts` WHERE postId IN (?)',
        [postIds],
      )

      // The old schema did not always enforce foreign keys: authors may be missing, and
      // links may point to missing terms (those links are dropped and counted).
      const missingAuthors = [
        ...new Set(rows.map((row) => row.authorId)),
      ].filter((id) => !authorIds.has(id))
      const validCategoryLinks = categoryLinks.filter((link) =>
        categoryIds.has(link.categoryId),
      )
      const validTagLinks = tagLinks.filter((link) => tagIds.has(link.tagId))

      try {
        await db.transaction(async (tx) => {
          if (missingAuthors.length > 0) {
            await tx
              .insert(schema.authors)
              .values(
                missingAuthors.map((id) => ({
                  id,
                  slug: `missing-author-${id}`,
                  name: `missing-author-${id}`,
                })),
              )
              .onConflictDoNothing({ target: schema.authors.id })
          }
          await tx
            .insert(schema.posts)
            .values(
              rows.map((row) => ({
                id: row.id,
                slug: clean(row.slug),
                title: clean(row.title),
                content: clean(row.content),
                excerpt: clean(toExcerpt(row.content)),
                featuredMediaUrl: cleanNullable(row.featuredMediaUrl),
                authorId: row.authorId,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
              })),
            )
            .onConflictDoUpdate(upsertChanged(schema.posts, schema.posts.id))
          for (const chunk of chunks(validCategoryLinks, LINK_CHUNK_SIZE)) {
            await tx
              .insert(schema.postCategories)
              .values(
                chunk.map((link) => ({
                  postId: link.postId,
                  categoryId: link.categoryId,
                })),
              )
              .onConflictDoNothing()
          }
          for (const chunk of chunks(validTagLinks, LINK_CHUNK_SIZE)) {
            await tx
              .insert(schema.postTags)
              .values(
                chunk.map((link) => ({
                  postId: link.postId,
                  tagId: link.tagId,
                })),
              )
              .onConflictDoNothing()
          }
        })
      } catch (error) {
        throw new Error(
          `Copying posts ${postIds[0]}–${postIds.at(-1)} failed: ${describeError(error)}`,
          { cause: error },
        )
      }

      for (const id of missingAuthors) {
        authorIds.add(id)
        placeholderAuthors.push(id)
      }
      skipped.categoryLinks += categoryLinks.length - validCategoryLinks.length
      skipped.tagLinks += tagLinks.length - validTagLinks.length
      copiedPosts += rows.length
      lastId = postIds.at(-1)!
      if (process.stdout.isTTY) {
        process.stdout.write(`\rPost → posts ${copiedPosts}/${totalPosts}`)
      } else if (copiedPosts % (size * 20) === 0) {
        console.log(`Post → posts ${copiedPosts}/${totalPosts}`)
      }
    }
    console.log(
      `${process.stdout.isTTY ? '\n' : ''}Post → posts: ${copiedPosts} rows`,
    )

    // --- housekeeping ---------------------------------------------------------------------
    // Explicit ids were inserted into identity columns: move the sequences past them.
    for (const table of ['authors', 'categories', 'tags', 'posts']) {
      await db.execute(
        sql.raw(
          `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, false)`,
        ),
      )
    }
    // Planner statistics, plus the visibility map that index-only scans (deep pages) rely on.
    await db.execute(sql`VACUUM ANALYZE`)

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
      { from: 'User', to: 'authors', adjust: placeholderAuthors.length },
      { from: 'Category', to: 'categories', adjust: 0 },
      { from: 'Tag', to: 'tags', adjust: 0 },
      { from: 'Post', to: 'posts', adjust: 0 },
      {
        from: 'CategoriesOnPosts',
        to: 'post_categories',
        adjust: -skipped.categoryLinks - orphanCategoryLinks,
      },
      {
        from: 'TagsOnPosts',
        to: 'post_tags',
        adjust: -skipped.tagLinks - orphanTagLinks,
      },
    ]
    const report = []
    for (const { from, to, adjust } of expected) {
      const sourceCount = await countSourceRows(
        source,
        `SELECT COUNT(*) AS count FROM \`${from}\``,
      )
      const { rows } = await client.query<{ count: number }>(
        `SELECT COUNT(*)::int AS count FROM ${to}`,
      )
      const targetCount = rows[0]?.count ?? 0
      report.push({
        source: from,
        target: to,
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
    for (const [what, count] of Object.entries(dropped)) {
      if (count > 0) console.warn(`Dropped ${count} ${what}`)
    }
    if (report.some((row) => !row.ok)) {
      console.error(
        'Row counts differ from the expected ones (rows from another source in the target database?)',
      )
      process.exitCode = 1
    }
    console.log(`Done in ${((performance.now() - started) / 1000).toFixed(1)}s`)
  } finally {
    await source.end()
    await client.end()
  }
}

try {
  await main()
} catch (error) {
  console.error(describeError(error))
  process.exitCode = 1
}
