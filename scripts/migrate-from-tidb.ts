/**
 * One-off data migration: TiDB (MySQL, old Prisma schema) → Neon (PostgreSQL, Drizzle schema).
 *
 *   1. Create the tables:   DATABASE_URL=... bun run db:migrate
 *   2. Copy the data:       SOURCE_DATABASE_URL=mysql://... DATABASE_URL=postgresql://... bun run db:copy-from-tidb
 *
 * - Every row is upserted by its primary key, so the script can safely be re-run.
 * - `posts.excerpt` (plain-text lead used for listings and meta descriptions) is computed here,
 *   which is why the app itself no longer needs an HTML parser (formerly jsdom) at runtime.
 */
import { getTableColumns, getTableName, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import mysql, { type RowDataPacket } from 'mysql2/promise'
import pg from 'pg'

import * as schema from '../src/db/schema'
import { toExcerpt } from './lib/excerpt'

const BATCH_SIZE = Number(process.env.BATCH_SIZE ?? 500)

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
  count: number
}

async function countSourceRows(connection: mysql.Connection, table: string): Promise<number> {
  const [rows] = await connection.query<SourceCount[]>(`SELECT COUNT(*) AS count FROM \`${table}\``)
  return Number(rows[0]?.count ?? 0)
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Environment variable ${name} is required`)
  return value
}

/** Builds mysql2 options from a URL, ignoring Prisma-specific query params such as `sslaccept`. */
function mysqlOptions(url: string): mysql.ConnectionOptions {
  const u = new URL(url)
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname)
  return {
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: decodeURIComponent(u.pathname.slice(1)),
    // Prisma stores DATETIME columns in UTC.
    timezone: 'Z',
    // TiDB Cloud only accepts TLS connections.
    ssl: isLocal ? undefined : { minVersion: 'TLSv1.2', rejectUnauthorized: true },
  }
}

/** PostgreSQL text cannot contain NUL characters. */
const clean = (value: string) => value.replaceAll('\0', '')
const cleanNullable = (value: string | null) => (value === null ? null : clean(value))

/** `SET col = excluded.col` for every column except the primary key. */
function excludedColumns(table: PgTable, primaryKey: PgColumn) {
  return Object.fromEntries(
    Object.entries(getTableColumns(table))
      .filter(([, column]) => column.name !== primaryKey.name)
      .map(([key, column]) => [key, sql.raw(`excluded."${column.name}"`)]),
  )
}

const source = await mysql.createConnection(mysqlOptions(requireEnv('SOURCE_DATABASE_URL')))
const client = new pg.Client({ connectionString: requireEnv('DATABASE_URL') })
await client.connect()
const db = drizzle({ client, schema })

const started = performance.now()
const skipped = { categoryLinks: 0, tagLinks: 0 }

try {
  // --- authors / categories / tags (small tables, copied in one go) -------------------------
  const termTables = [
    { from: 'User', to: schema.authors },
    { from: 'Category', to: schema.categories },
    { from: 'Tag', to: schema.tags },
  ] as const
  const knownIds = new Map<string, Set<number>>()
  for (const { from, to } of termTables) {
    const [rows] = await source.query<SourceTerm[]>(
      `SELECT id, slug, name, description FROM \`${from}\` ORDER BY id`,
    )
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      await db
        .insert(to)
        .values(
          rows.slice(i, i + BATCH_SIZE).map((row) => ({
            id: row.id,
            slug: clean(row.slug),
            name: clean(row.name),
            description: cleanNullable(row.description),
          })),
        )
        .onConflictDoUpdate({ target: to.id, set: excludedColumns(to, to.id) })
    }
    knownIds.set(from, new Set(rows.map((row) => row.id)))
    console.log(`${from} → ${getTableName(to)}: ${rows.length} rows`)
  }
  const authorIds = knownIds.get('User')!
  const categoryIds = knownIds.get('Category')!
  const tagIds = knownIds.get('Tag')!

  // --- posts (+ their category / tag links), keyset-paginated by id -------------------------
  const totalPosts = await countSourceRows(source, 'Post')
  let copiedPosts = 0
  let lastId = 0
  for (;;) {
    const [rows] = await source.query<SourcePost[]>(
      'SELECT id, slug, createdAt, updatedAt, title, content, authorId, featuredMediaUrl FROM `Post` WHERE id > ? ORDER BY id LIMIT ?',
      [lastId, BATCH_SIZE],
    )
    if (rows.length === 0) break

    // Posts may reference authors that no longer exist (the old schema did not always enforce FKs).
    const missingAuthors = [...new Set(rows.map((row) => row.authorId))].filter(
      (id) => !authorIds.has(id),
    )
    if (missingAuthors.length > 0) {
      console.warn(`\nCreating placeholder authors for missing ids: ${missingAuthors.join(', ')}`)
      await db
        .insert(schema.authors)
        .values(missingAuthors.map((id) => ({ id, slug: `author-${id}`, name: `author-${id}` })))
        .onConflictDoNothing()
      for (const id of missingAuthors) authorIds.add(id)
    }

    await db
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
      .onConflictDoUpdate({
        target: schema.posts.id,
        set: excludedColumns(schema.posts, schema.posts.id),
      })

    const postIds = rows.map((row) => row.id)
    const [categoryLinks] = await source.query<RowDataPacket[]>(
      'SELECT postId, categoryId FROM `CategoriesOnPosts` WHERE postId IN (?)',
      [postIds],
    )
    const validCategoryLinks = categoryLinks.filter((link) => categoryIds.has(link.categoryId))
    skipped.categoryLinks += categoryLinks.length - validCategoryLinks.length
    if (validCategoryLinks.length > 0) {
      await db
        .insert(schema.postCategories)
        .values(validCategoryLinks.map((link) => ({ postId: link.postId, categoryId: link.categoryId })))
        .onConflictDoNothing()
    }

    const [tagLinks] = await source.query<RowDataPacket[]>(
      'SELECT postId, tagId FROM `TagsOnPosts` WHERE postId IN (?)',
      [postIds],
    )
    const validTagLinks = tagLinks.filter((link) => tagIds.has(link.tagId))
    skipped.tagLinks += tagLinks.length - validTagLinks.length
    if (validTagLinks.length > 0) {
      await db
        .insert(schema.postTags)
        .values(validTagLinks.map((link) => ({ postId: link.postId, tagId: link.tagId })))
        .onConflictDoNothing()
    }

    copiedPosts += rows.length
    lastId = postIds.at(-1)!
    process.stdout.write(`\rPost → posts ${copiedPosts}/${totalPosts}`)
  }
  process.stdout.write('\n')

  // --- housekeeping ---------------------------------------------------------------------------
  // Explicit ids were inserted into identity columns: move the sequences past them.
  for (const table of ['authors', 'categories', 'tags', 'posts']) {
    await db.execute(
      sql.raw(
        `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, false)`,
      ),
    )
  }
  await db.execute(sql`ANALYZE`)

  // --- verification ---------------------------------------------------------------------------
  const pairs = [
    ['User', 'authors'],
    ['Category', 'categories'],
    ['Tag', 'tags'],
    ['Post', 'posts'],
    ['CategoriesOnPosts', 'post_categories'],
    ['TagsOnPosts', 'post_tags'],
  ] as const
  const report = []
  for (const [from, to] of pairs) {
    const sourceCount = await countSourceRows(source, from)
    const { rows } = await client.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM ${to}`,
    )
    report.push({ source: from, target: to, sourceCount, targetCount: rows[0]!.count })
  }
  console.table(report)
  if (skipped.categoryLinks || skipped.tagLinks) {
    console.warn(
      `Skipped links to missing terms: ${skipped.categoryLinks} category links, ${skipped.tagLinks} tag links`,
    )
  }
  console.log(`Done in ${((performance.now() - started) / 1000).toFixed(1)}s`)
} finally {
  await source.end()
  await client.end()
}
