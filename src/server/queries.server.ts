import { and, desc, eq, ilike, inArray, sql, type SQL } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'

import {
  authors,
  categories,
  postCategories,
  posts,
  postTags,
  tags,
} from '../db/schema'
import type { CategoryRef, PostDetail, PostPage, TermPostPage } from './types'

export type Database = PgDatabase<PgQueryResultHKT>

export const PAGE_SIZE = 20

/** Width of the slug column in the old MySQL schema (Prisma's VARCHAR(191)); longer slugs were cut. */
const LEGACY_SLUG_LENGTH = 191

/** Categories of the current `posts` row as a JSON array (one round trip, no N+1). */
const postCategoriesJson = sql<CategoryRef[]>`coalesce((
  select json_agg(json_build_object('id', ${categories.id}, 'slug', ${categories.slug}, 'name', ${categories.name}) order by ${categories.id})
  from ${postCategories}
  inner join ${categories} on ${categories.id} = ${postCategories.categoryId}
  where ${postCategories.postId} = ${posts.id}
), '[]'::json)`

const summaryColumns = {
  id: posts.id,
  slug: posts.slug,
  title: posts.title,
  excerpt: posts.excerpt,
  featuredMediaUrl: posts.featuredMediaUrl,
  createdAt: posts.createdAt,
  author: { slug: authors.slug, name: authors.name },
  categories: postCategoriesJson,
}

const newestFirst = [desc(posts.createdAt), desc(posts.id)]

type PostFilter =
  | { kind: 'all' }
  | { kind: 'category'; id: number }
  | { kind: 'tag'; id: number }
  | { kind: 'author'; id: number }
  | { kind: 'title'; words: string[] }

const escapeLike = (value: string) =>
  value.replace(/[\\%_]/g, (char) => `\\${char}`)

/**
 * One page of article summaries, newest first.
 *
 * The page of ids is selected first and only those rows are joined/aggregated:
 * PostgreSQL evaluates select-list subqueries for rows skipped by OFFSET too,
 * which made deep pages several seconds slow.
 */
async function listPosts(
  db: Database,
  filter: PostFilter,
  page: number,
): Promise<PostPage> {
  let ids = db.select({ id: posts.id }).from(posts).$dynamic()
  let where: SQL | undefined
  switch (filter.kind) {
    case 'category':
      ids = ids.innerJoin(postCategories, eq(postCategories.postId, posts.id))
      where = eq(postCategories.categoryId, filter.id)
      break
    case 'tag':
      ids = ids.innerJoin(postTags, eq(postTags.postId, posts.id))
      where = eq(postTags.tagId, filter.id)
      break
    case 'author':
      where = eq(posts.authorId, filter.id)
      break
    case 'title':
      where = and(
        ...filter.words.map((word) =>
          ilike(posts.title, `%${escapeLike(word)}%`),
        ),
      )
      break
  }
  const pageIds = ids
    .where(where)
    .orderBy(...newestFirst)
    .limit(PAGE_SIZE + 1) // one extra row tells whether a next page exists
    .offset((page - 1) * PAGE_SIZE)
    .as('page_ids')

  const rows = await db
    .select(summaryColumns)
    .from(pageIds)
    .innerJoin(posts, eq(posts.id, pageIds.id))
    .innerJoin(authors, eq(authors.id, posts.authorId))
    .orderBy(...newestFirst)

  return {
    posts: rows.slice(0, PAGE_SIZE),
    page,
    hasNextPage: rows.length > PAGE_SIZE,
  }
}

export function getLatestPosts(db: Database, page: number): Promise<PostPage> {
  return listPosts(db, { kind: 'all' }, page)
}

/**
 * Finds an article by its stored slug. Slugs longer than the legacy column width
 * (links that predate the truncation) fall back to their 191-character prefix.
 */
export async function getPostBySlug(
  db: Database,
  slug: string,
): Promise<PostDetail | undefined> {
  const candidates =
    slug.length > LEGACY_SLUG_LENGTH
      ? [slug, slug.slice(0, LEGACY_SLUG_LENGTH)]
      : [slug]
  const [post] = await db
    .select({
      ...summaryColumns,
      content: posts.content,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .innerJoin(authors, eq(authors.id, posts.authorId))
    .where(inArray(posts.slug, candidates))
    .orderBy(desc(sql`length(${posts.slug})`))
    .limit(1)
  return post
}

export async function getCategoryPosts(
  db: Database,
  slug: string,
  page: number,
): Promise<TermPostPage | undefined> {
  const [term] = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      description: categories.description,
    })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1)
  if (!term) return undefined
  const { id, ...rest } = term
  return {
    ...(await listPosts(db, { kind: 'category', id }, page)),
    term: rest,
  }
}

export async function getTagPosts(
  db: Database,
  slug: string,
  page: number,
): Promise<TermPostPage | undefined> {
  const [term] = await db
    .select({
      id: tags.id,
      slug: tags.slug,
      name: tags.name,
      description: tags.description,
    })
    .from(tags)
    .where(eq(tags.slug, slug))
    .limit(1)
  if (!term) return undefined
  const { id, ...rest } = term
  return { ...(await listPosts(db, { kind: 'tag', id }, page)), term: rest }
}

export async function getAuthorPosts(
  db: Database,
  slug: string,
  page: number,
): Promise<TermPostPage | undefined> {
  const [term] = await db
    .select({
      id: authors.id,
      slug: authors.slug,
      name: authors.name,
      description: authors.description,
    })
    .from(authors)
    .where(eq(authors.slug, slug))
    .limit(1)
  if (!term) return undefined
  const { id, ...rest } = term
  return { ...(await listPosts(db, { kind: 'author', id }, page)), term: rest }
}

/** Title search; every whitespace-separated word must match (case-insensitive). */
export function searchPosts(
  db: Database,
  query: string,
  page: number,
): Promise<PostPage> {
  const words = query.split(/\s+/).filter(Boolean).slice(0, 5)
  return listPosts(db, { kind: 'title', words }, page)
}
