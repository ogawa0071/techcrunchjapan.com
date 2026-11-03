import type { AnyRouter } from '@tanstack/react-router'
import { notFound, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { withDb } from '../db/client.server'
import { jstDateParts } from '../lib/date'
import { postPath } from '../lib/paths'
import { toStoredSlug } from '../lib/slug'
import * as queries from './queries.server'
import type { PostPage } from './types'

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

function toText(value: unknown, maxLength = 1000): string {
  return typeof value === 'string' ? value.slice(0, maxLength) : ''
}

/** Listings past their last page are 404s rather than empty pages. */
function existingPage<T extends PostPage>(result: T | undefined): T {
  if (!result || (result.page > 1 && result.posts.length === 0)) throw notFound()
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

export const getPost = createServerFn({ method: 'GET' })
  .validator(
    (data: PostInput): PostInput => ({
      year: toText(data?.year),
      month: toText(data?.month),
      day: toText(data?.day),
      slug: toText(data?.slug),
    }),
  )
  .handler(async ({ data }) => {
    const slug = toStoredSlug(data.slug)
    const post = slug ? await withDb((db) => queries.getPostBySlug(db, slug)) : undefined
    if (!post) throw notFound()

    // One canonical URL per article: wrong dates (or legacy over-long slugs) redirect.
    const date = jstDateParts(post.createdAt)
    if (
      post.slug !== slug ||
      data.year !== date.year ||
      data.month !== date.month ||
      data.day !== date.day
    ) {
      throw redirect<AnyRouter>({ href: postPath(post), statusCode: 301 })
    }
    return post
  })

export const getCategoryPosts = createServerFn({ method: 'GET' })
  .validator(termInput)
  .handler(async ({ data }) => {
    const slug = toStoredSlug(data.slug)
    return existingPage(
      slug ? await withDb((db) => queries.getCategoryPosts(db, slug, data.page)) : undefined,
    )
  })

export const getTagPosts = createServerFn({ method: 'GET' })
  .validator(termInput)
  .handler(async ({ data }) => {
    const slug = toStoredSlug(data.slug)
    return existingPage(
      slug ? await withDb((db) => queries.getTagPosts(db, slug, data.page)) : undefined,
    )
  })

export const getAuthorPosts = createServerFn({ method: 'GET' })
  .validator(termInput)
  .handler(async ({ data }) => {
    const slug = toStoredSlug(data.slug)
    return existingPage(
      slug ? await withDb((db) => queries.getAuthorPosts(db, slug, data.page)) : undefined,
    )
  })

interface SearchInput {
  query: string
  page: number
}

export const searchPosts = createServerFn({ method: 'GET' })
  .validator(
    (data: SearchInput): SearchInput => ({
      query: toText(data?.query, 100).trim(),
      page: toPage(data?.page),
    }),
  )
  .handler(async ({ data }) =>
    existingPage(await withDb((db) => queries.searchPosts(db, data.query, data.page))),
  )
