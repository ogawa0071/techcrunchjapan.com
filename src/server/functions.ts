import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { withDb } from '../db/client.server'
import { jstDateParts } from '../lib/date'
import { postPath } from '../lib/paths'
import { toStoredSlug } from '../lib/slug'
import * as queries from './queries.server'
import type { PostDetail, PostPage } from './types'

// Server functions are plain GET endpoints (/_serverFn/<id>?payload=…) that anyone can
// call, so inputs are coerced here instead of trusting the TypeScript types.

/** Deeper pages do not exist (64k articles / 20 per page); larger numbers are 404s. */
const MAX_PAGE = 10_000

function toPage(value: unknown): number {
  const page = Number(value)
  if (!Number.isSafeInteger(page) || page < 1) return 1
  if (page > MAX_PAGE) throw notFound()
  return page
}

/** NUL characters are dropped: SQLite's string functions stop at them. */
function toText(value: unknown, maxLength = 1000): string {
  return typeof value === 'string'
    ? value.replaceAll('\0', '').slice(0, maxLength)
    : ''
}

/** Listings past their last page are 404s rather than empty pages. */
function existingPage<T extends PostPage>(result: T | undefined): T {
  if (!result || (result.page > 1 && result.posts.length === 0))
    throw notFound()
  return result
}

interface PageInput {
  page: number
}

interface TermInput {
  slug: string
  page: number
}

const termInput = (data: TermInput): TermInput => ({
  slug: toText(data?.slug),
  page: toPage(data?.page),
})

export const getLatestPosts = createServerFn({ method: 'GET' })
  .validator((data: PageInput): PageInput => ({ page: toPage(data?.page) }))
  .handler(async ({ data }) =>
    existingPage(await withDb((db) => queries.getLatestPosts(db, data.page))),
  )

export interface PostInput {
  year: string
  month: string
  day: string
  slug: string
}

/**
 * An article, or its canonical path to redirect to. On full page loads the server entry
 * adds the visitor's query string to the redirect.
 */
export type PostResult = { post: PostDetail } | { redirectTo: string }

export const getPost = createServerFn({ method: 'GET' })
  .validator((data: PostInput): PostInput => ({
    year: toText(data?.year),
    month: toText(data?.month),
    day: toText(data?.day),
    slug: toText(data?.slug),
  }))
  .handler(async ({ data }): Promise<PostResult> => {
    const slug = toStoredSlug(data.slug)
    const post = slug
      ? await withDb((db) => queries.getPostBySlug(db, slug))
      : undefined
    if (!post) throw notFound()

    // One canonical URL per article: wrong dates (or legacy over-long slugs) redirect.
    const date = jstDateParts(post.createdAt)
    if (
      post.slug !== slug ||
      data.year !== date.year ||
      data.month !== date.month ||
      data.day !== date.day
    ) {
      return { redirectTo: postPath(post) }
    }
    return { post }
  })

/**
 * Canonical path of an article addressed by an old dateless permalink:
 * `/archives/<slug>/` or `/archives/<WordPress post id>/` (also `/?p=<id>`).
 */
export const getLegacyPostPath = createServerFn({ method: 'GET' })
  .validator((data: { key: string }) => ({ key: toText(data?.key) }))
  .handler(async ({ data }) => {
    const id = /^\d{1,9}$/.test(data.key) ? Number(data.key) : undefined
    const slug = toStoredSlug(data.key)
    const post = await withDb((db) =>
      id === undefined
        ? slug
          ? queries.getPostLocationBySlug(db, slug)
          : Promise.resolve(undefined)
        : queries.getPostLocationById(db, id),
    )
    if (!post) throw notFound()
    return postPath(post)
  })

export const getCategoryPosts = createServerFn({ method: 'GET' })
  .validator(termInput)
  .handler(async ({ data }) => {
    const slug = toStoredSlug(data.slug)
    return existingPage(
      slug
        ? await withDb((db) => queries.getCategoryPosts(db, slug, data.page))
        : undefined,
    )
  })

export const getTagPosts = createServerFn({ method: 'GET' })
  .validator(termInput)
  .handler(async ({ data }) => {
    const slug = toStoredSlug(data.slug)
    return existingPage(
      slug
        ? await withDb((db) => queries.getTagPosts(db, slug, data.page))
        : undefined,
    )
  })

export const getAuthorPosts = createServerFn({ method: 'GET' })
  .validator(termInput)
  .handler(async ({ data }) => {
    const slug = toStoredSlug(data.slug)
    return existingPage(
      slug
        ? await withDb((db) => queries.getAuthorPosts(db, slug, data.page))
        : undefined,
    )
  })

interface SearchInput {
  query: string
  page: number
}

export const searchPosts = createServerFn({ method: 'GET' })
  .validator((data: SearchInput): SearchInput => ({
    query: toText(data?.query, 100).trim(),
    page: toPage(data?.page),
  }))
  .handler(async ({ data }) =>
    existingPage(
      await withDb((db) => queries.searchPosts(db, data.query, data.page)),
    ),
  )
