import { and, desc, eq, inArray, sql, type SQL } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'

import {
  authors,
  categories,
  postCategories,
  posts,
  postTags,
  tags,
} from '../db/schema'
import { searchWords } from '../lib/search'
import type {
  CategoryRef,
  PostDetail,
  PostPage,
  PostSummary,
  Term,
  TermPostPage,
} from './types'

export type Database = DrizzleD1Database

export const PAGE_SIZE = 20

/** Width of the slug column in the old MySQL schema (Prisma's VARCHAR(191)); longer slugs were cut. */
const LEGACY_SLUG_LENGTH = 191

/** The JSON array built by `categoriesJson`. */
function parseCategories(value: unknown): CategoryRef[] {
  if (typeof value !== 'string') return []
  const list: CategoryRef[] = JSON.parse(value)
  return list
}

/**
 * The categories of each post as a JSON array (ordered by id), so that a page is one
 * statement (one round trip to D1). SQLite evaluates it only for the returned rows.
 */
const categoriesJson = sql`(
  SELECT json_group_array(
    json_object('id', ${categories.id}, 'slug', ${categories.slug}, 'name', ${categories.name})
    ORDER BY ${categories.id}
  )
  FROM ${postCategories}
  INNER JOIN ${categories} ON ${categories.id} = ${postCategories.categoryId}
  WHERE ${postCategories.postId} = ${posts.id}
)`
  .mapWith(parseCategories)
  .as('categories')

// Results of db.batch() are keyed by column name, so names that repeat (slug, name) are
// aliased.
const summaryColumns = {
  id: posts.id,
  slug: posts.slug,
  title: posts.title,
  excerpt: posts.excerpt,
  featuredMediaUrl: posts.featuredMediaUrl,
  createdAt: posts.createdAt,
  author: {
    slug: authors.slug.as('author_slug'),
    name: authors.name.as('author_name'),
  },
}

const newestFirst = [desc(posts.createdAt), desc(posts.id)]

/**
 * Stored slugs that a requested slug may refer to: itself, and for slugs longer than the
 * legacy column width (links that predate the truncation) its 191-character prefix.
 */
function slugCandidates(slug: string): string[] {
  return slug.length > LEGACY_SLUG_LENGTH
    ? [slug, slug.slice(0, LEGACY_SLUG_LENGTH)]
    : [slug]
}

type PostFilter =
  | { kind: 'all' }
  | { kind: 'category'; slug: string }
  | { kind: 'tag'; slug: string }
  | { kind: 'author'; slug: string }
  | { kind: 'title'; words: string[] }

/**
 * Ids of one page of posts (plus one, which tells whether a next page exists), newest
 * first. Every variant reads an index in order and stops after the page:
 * posts (created_at, id, search_title), posts (author_id, created_at, id), and the link
 * tables' (term id, post_created_at, post_id).
 */
function pageIds(db: Database, filter: PostFilter, page: number) {
  const limit = PAGE_SIZE + 1
  const offset = (page - 1) * PAGE_SIZE
  if (filter.kind === 'category') {
    return db
      .select({ id: postCategories.postId })
      .from(postCategories)
      .where(
        eq(
          postCategories.categoryId,
          db
            .select({ id: categories.id })
            .from(categories)
            .where(eq(categories.slug, filter.slug)),
        ),
      )
      .orderBy(desc(postCategories.postCreatedAt), desc(postCategories.postId))
      .limit(limit)
      .offset(offset)
  }
  if (filter.kind === 'tag') {
    return db
      .select({ id: postTags.postId })
      .from(postTags)
      .where(
        eq(
          postTags.tagId,
          db
            .select({ id: tags.id })
            .from(tags)
            .where(eq(tags.slug, filter.slug)),
        ),
      )
      .orderBy(desc(postTags.postCreatedAt), desc(postTags.postId))
      .limit(limit)
      .offset(offset)
  }
  let where: SQL | undefined
  if (filter.kind === 'author') {
    where = eq(
      posts.authorId,
      db
        .select({ id: authors.id })
        .from(authors)
        .where(eq(authors.slug, filter.slug)),
    )
  } else if (filter.kind === 'title') {
    // instr() rather than LIKE: D1 limits LIKE patterns to 50 bytes (about 16 Japanese
    // characters), and no wildcard escaping is needed. Both sides are in search form
    // (lib/search.ts), as SQLite only folds the case of ASCII letters.
    where = and(
      ...filter.words.map(
        (word) => sql`instr(${posts.searchTitle}, ${word}) > 0`,
      ),
    )
  }
  return db
    .select({ id: posts.id })
    .from(posts)
    .where(where)
    .orderBy(...newestFirst)
    .limit(limit)
    .offset(offset)
}

/**
 * One page of article summaries, newest first, as a single statement.
 *
 * CROSS JOIN fixes SQLite's join order, so the page of ids drives the lookups: with
 * INNER JOINs the planner may instead walk every post in date order (to skip sorting
 * 21 rows) and read the whole table.
 */
function listPosts(db: Database, filter: PostFilter, page: number) {
  const ids = pageIds(db, filter, page).as('page_ids')
  return db
    .select({ ...summaryColumns, categories: categoriesJson })
    .from(ids)
    .crossJoin(posts)
    .crossJoin(authors)
    .where(and(eq(posts.id, ids.id), eq(authors.id, posts.authorId)))
    .orderBy(...newestFirst)
}

function toPostPage(rows: PostSummary[], page: number): PostPage {
  return {
    posts: rows.slice(0, PAGE_SIZE),
    page,
    hasNextPage: rows.length > PAGE_SIZE,
  }
}

export async function getLatestPosts(
  db: Database,
  page: number,
): Promise<PostPage> {
  return toPostPage(await listPosts(db, { kind: 'all' }, page), page)
}

/**
 * Finds an article by its stored slug. Slugs longer than the legacy column width
 * (links that predate the truncation) fall back to their 191-character prefix.
 */
export async function getPostBySlug(
  db: Database,
  slug: string,
): Promise<PostDetail | undefined> {
  const [post] = await db
    .select({
      ...summaryColumns,
      content: posts.content,
      updatedAt: posts.updatedAt,
      categories: categoriesJson,
    })
    .from(posts)
    .innerJoin(authors, eq(authors.id, posts.authorId))
    .where(inArray(posts.slug, slugCandidates(slug)))
    .orderBy(desc(sql`length(${posts.slug})`))
    .limit(1)
  return post
}

export interface PostLocation {
  slug: string
  createdAt: Date
}

export async function getPostLocationById(
  db: Database,
  id: number,
): Promise<PostLocation | undefined> {
  const [post] = await db
    .select({ slug: posts.slug, createdAt: posts.createdAt })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1)
  return post
}

export async function getPostLocationBySlug(
  db: Database,
  slug: string,
): Promise<PostLocation | undefined> {
  const [post] = await db
    .select({ slug: posts.slug, createdAt: posts.createdAt })
    .from(posts)
    .where(inArray(posts.slug, slugCandidates(slug)))
    .orderBy(desc(sql`length(${posts.slug})`))
    .limit(1)
  return post
}

type TermTable = typeof categories | typeof tags | typeof authors

/**
 * A category, tag or author page: the term and its page of posts in one round trip
 * (db.batch). `undefined` when the term does not exist.
 */
async function getTermPosts(
  db: Database,
  table: TermTable,
  filter: Extract<PostFilter, { slug: string }>,
  page: number,
): Promise<TermPostPage | undefined> {
  const [terms, rows] = await db.batch([
    db
      .select({
        slug: table.slug,
        name: table.name,
        description: table.description,
      })
      .from(table)
      .where(eq(table.slug, filter.slug))
      .limit(1),
    listPosts(db, filter, page),
  ])
  const term: Term | undefined = terms[0]
  return term ? { ...toPostPage(rows, page), term } : undefined
}

export function getCategoryPosts(
  db: Database,
  slug: string,
  page: number,
): Promise<TermPostPage | undefined> {
  return getTermPosts(db, categories, { kind: 'category', slug }, page)
}

export function getTagPosts(
  db: Database,
  slug: string,
  page: number,
): Promise<TermPostPage | undefined> {
  return getTermPosts(db, tags, { kind: 'tag', slug }, page)
}

export function getAuthorPosts(
  db: Database,
  slug: string,
  page: number,
): Promise<TermPostPage | undefined> {
  return getTermPosts(db, authors, { kind: 'author', slug }, page)
}

/**
 * Title search: every whitespace-separated word must appear, ignoring case and
 * full-width / half-width differences.
 */
export async function searchPosts(
  db: Database,
  query: string,
  page: number,
): Promise<PostPage> {
  const words = searchWords(query)
  return toPostPage(await listPosts(db, { kind: 'title', words }, page), page)
}
