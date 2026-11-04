// The query layer against a real D1 database (workerd, in memory) with the migrations in
// drizzle/: SQL that SQLite or D1 rejects, wrong ordering, or rows mangled by db.batch()
// fail here rather than in production.
import { fileURLToPath } from 'node:url'

import { drizzle, type AnyD1Database } from 'drizzle-orm/d1'
import { migrate } from 'drizzle-orm/d1/migrator'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPlatformProxy } from 'wrangler'

import * as schema from '../src/db/schema'
import { toSearchText } from '../src/lib/search'
import {
  getAuthorPosts,
  getCategoryPosts,
  getLatestPosts,
  getPostBySlug,
  getPostLocationById,
  getPostLocationBySlug,
  getTagPosts,
  PAGE_SIZE,
  searchPosts,
  type Database,
} from '../src/server/queries.server'

const root = new URL('..', import.meta.url)
let proxy: Awaited<ReturnType<typeof getPlatformProxy<{ DB: AnyD1Database }>>>
let db: Database

const DAY = 24 * 60 * 60 * 1000
const base = Date.UTC(2020, 0, 1)
const LONG_SLUG = 'a'.repeat(200)

/** Post `n` (1-25) was published `n` days after 2020-01-01; 24 and 25 at the same time. */
function post(
  n: number,
  title: string,
  overrides: Partial<typeof schema.posts.$inferInsert> = {},
) {
  const createdAt = new Date(base + Math.min(n, 24) * DAY)
  return {
    id: n,
    slug: `post-${n}`,
    title,
    searchTitle: toSearchText(title),
    content: `<p>${title}</p>`,
    excerpt: title,
    featuredMediaUrl: n % 2 ? null : `/wp-content/uploads/${n}.jpg`,
    authorId: n % 3 ? 1 : 2,
    createdAt,
    updatedAt: new Date(createdAt.getTime() + 123),
    ...overrides,
  }
}

const titles: Record<number, string> = {
  1: 'Startup closes Series A',
  2: 'ＡＩ スタートアップが資金調達',
  3: 'AI chips',
  4: 'Growth of 100% in a year',
  5: 'a_b testing',
  6: 'あいうえおかきくけこさしすせそたちつてと',
}

beforeAll(async () => {
  proxy = await getPlatformProxy<{ DB: AnyD1Database }>({
    configPath: fileURLToPath(new URL('wrangler.jsonc', root)),
    persist: false,
    remoteBindings: false,
  })
  db = drizzle(proxy.env.DB)
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL('drizzle', root)),
  })
  await db.batch([
    db.insert(schema.authors).values([
      { id: 1, slug: 'alice', name: 'Alice <A&B>', description: 'Writer' },
      { id: 2, slug: 'bob', name: 'Bob' },
    ]),
    db.insert(schema.categories).values([
      { id: 10, slug: 'news', name: 'ニュース' },
      { id: 11, slug: 'feature', name: '特集', description: 'Long reads' },
      { id: 12, slug: 'empty', name: 'Empty' },
    ]),
    db.insert(schema.tags).values([{ id: 20, slug: 'ai', name: 'AI' }]),
  ])
  const posts = Array.from({ length: 25 }, (_, i) =>
    post(i + 1, titles[i + 1] ?? `Post ${i + 1}`),
  )
  posts[6] = post(7, 'Long slug', { slug: LONG_SLUG.slice(0, 191) })
  posts[7] = post(8, 'Encoded slug', { slug: '%e3%81%82' })
  const createdAt = (postId: number) => posts[postId - 1]!.createdAt
  const categoryLink = (postId: number, categoryId: number) => ({
    postId,
    categoryId,
    postCreatedAt: createdAt(postId),
  })
  const tagLink = (postId: number, tagId: number) => ({
    postId,
    tagId,
    postCreatedAt: createdAt(postId),
  })
  // One row per INSERT: D1 binds at most 100 parameters per statement.
  const [first, ...rest] = posts.map((row) =>
    db.insert(schema.posts).values(row),
  )
  await db.batch([
    first!,
    ...rest,
    db
      .insert(schema.postCategories)
      .values([
        categoryLink(1, 11),
        categoryLink(1, 10),
        categoryLink(2, 10),
        categoryLink(24, 10),
        categoryLink(25, 10),
      ]),
    db.insert(schema.postTags).values([tagLink(2, 20), tagLink(3, 20)]),
  ])
}, 60_000)

afterAll(async () => {
  await proxy?.dispose()
})

const ids = (page: { posts: { id: number }[] }) => page.posts.map((p) => p.id)

describe('getLatestPosts', () => {
  it('lists newest first, ties broken by id', async () => {
    const page = await getLatestPosts(db, 1)
    expect(page.posts).toHaveLength(PAGE_SIZE)
    expect(ids(page).slice(0, 4)).toEqual([25, 24, 23, 22])
    expect(page.hasNextPage).toBe(true)
  })

  it('returns the remaining posts on the last page', async () => {
    const page = await getLatestPosts(db, 2)
    expect(ids(page)).toEqual([5, 4, 3, 2, 1])
    expect(page.hasNextPage).toBe(false)
  })

  it('returns no posts past the last page', async () => {
    expect((await getLatestPosts(db, 3)).posts).toEqual([])
  })

  it('includes the author and the categories ordered by id', async () => {
    const page = await getLatestPosts(db, 2)
    const first = page.posts.find((p) => p.id === 1)!
    expect(first).toMatchObject({
      slug: 'post-1',
      title: 'Startup closes Series A',
      featuredMediaUrl: null,
      author: { slug: 'alice', name: 'Alice <A&B>' },
      categories: [
        { id: 10, slug: 'news', name: 'ニュース' },
        { id: 11, slug: 'feature', name: '特集' },
      ],
    })
    expect(first.createdAt).toEqual(new Date(base + DAY))
    expect(page.posts.find((p) => p.id === 3)?.categories).toEqual([])
  })
})

describe('term pages (db.batch)', () => {
  it('returns a category and its posts without mixing up columns', async () => {
    const page = await getCategoryPosts(db, 'news', 1)
    expect(page?.term).toEqual({
      slug: 'news',
      name: 'ニュース',
      description: null,
    })
    expect(page && ids(page)).toEqual([25, 24, 2, 1])
    const [newest] = page!.posts
    expect(newest).toMatchObject({
      id: 25,
      slug: 'post-25',
      title: 'Post 25',
      author: { slug: 'alice', name: 'Alice <A&B>' },
    })
    expect(newest?.createdAt).toEqual(new Date(base + 24 * DAY))
    expect(page?.hasNextPage).toBe(false)
  })

  it('returns an empty page for a term without posts', async () => {
    const page = await getCategoryPosts(db, 'empty', 1)
    expect(page?.term.name).toBe('Empty')
    expect(page?.posts).toEqual([])
  })

  it('returns undefined for a missing term', async () => {
    expect(await getCategoryPosts(db, 'missing', 1)).toBeUndefined()
    expect(await getTagPosts(db, 'missing', 1)).toBeUndefined()
    expect(await getAuthorPosts(db, 'missing', 1)).toBeUndefined()
  })

  it('lists tag and author pages', async () => {
    expect(ids((await getTagPosts(db, 'ai', 1))!)).toEqual([3, 2])
    const bob = await getAuthorPosts(db, 'bob', 1)
    expect(bob?.term).toEqual({ slug: 'bob', name: 'Bob', description: null })
    expect(ids(bob!)).toEqual([24, 21, 18, 15, 12, 9, 6, 3])
  })
})

describe('searchPosts', () => {
  it('requires every word, ignoring case', async () => {
    expect(ids(await searchPosts(db, 'series   STARTUP', 1))).toEqual([1])
  })

  it('folds full-width letters', async () => {
    expect(ids(await searchPosts(db, 'ai', 1))).toEqual([3, 2])
    expect(ids(await searchPosts(db, 'ＡＩ', 1))).toEqual([3, 2])
  })

  it('treats % and _ literally', async () => {
    expect(ids(await searchPosts(db, '100%', 1))).toEqual([4])
    expect(ids(await searchPosts(db, 'a_b', 1))).toEqual([5])
  })

  it('accepts words longer than D1’s LIKE pattern limit', async () => {
    expect(ids(await searchPosts(db, titles[6]!, 1))).toEqual([6])
  })

  it('lists every post for a blank query', async () => {
    expect((await searchPosts(db, ' ', 1)).posts).toHaveLength(PAGE_SIZE)
  })
})

describe('getPostBySlug', () => {
  it('returns the article with its content and categories', async () => {
    const article = await getPostBySlug(db, 'post-1')
    expect(article).toMatchObject({
      id: 1,
      content: '<p>Startup closes Series A</p>',
      categories: [{ id: 10 }, { id: 11 }],
    })
    expect(article?.updatedAt).toEqual(new Date(base + DAY + 123))
  })

  it('finds a truncated slug by its original, longer form', async () => {
    expect((await getPostBySlug(db, LONG_SLUG))?.id).toBe(7)
  })

  it('returns undefined for an unknown slug', async () => {
    expect(await getPostBySlug(db, 'nope')).toBeUndefined()
  })
})

describe('legacy locations', () => {
  it('finds posts by id and by slug', async () => {
    expect(await getPostLocationById(db, 8)).toEqual({
      slug: '%e3%81%82',
      createdAt: new Date(base + 8 * DAY),
    })
    expect((await getPostLocationBySlug(db, LONG_SLUG))?.slug).toBe(
      LONG_SLUG.slice(0, 191),
    )
    expect(await getPostLocationById(db, 999)).toBeUndefined()
  })
})
