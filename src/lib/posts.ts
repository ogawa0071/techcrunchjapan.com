import { categories, categoriesOnPosts, posts, users } from '@schema'
import { db, desc, eq, inArray } from 'void/db'
import { dateToString, dateToUrl } from './date'
import { htmlToText } from './html'

const excerptLength = 270

const postColumns = {
  id: posts.id,
  slug: posts.slug,
  createdAt: posts.createdAt,
  title: posts.title,
  content: posts.content,
  featuredMediaUrl: posts.featuredMediaUrl,
  author: {
    slug: users.slug,
    name: users.name,
  },
}

type PostRow = {
  id: number
  slug: string
  createdAt: Date
  title: string
  content: string
  featuredMediaUrl: string | null
  author: { slug: string; name: string }
}

async function findCategories(postIds: number[]) {
  if (postIds.length === 0) return new Map<number, Category[]>()

  const rows = await db
    .select({
      postId: categoriesOnPosts.postId,
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
    })
    .from(categoriesOnPosts)
    .innerJoin(categories, eq(categoriesOnPosts.categoryId, categories.id))
    .where(inArray(categoriesOnPosts.postId, postIds))
    .orderBy(categoriesOnPosts.postId, categoriesOnPosts.categoryId)

  const byPost = new Map<number, Category[]>()
  for (const { postId, ...category } of rows) {
    byPost.set(postId, [...(byPost.get(postId) ?? []), category])
  }

  return byPost
}

function toPost(
  { content, createdAt, ...post }: PostRow,
  categories: Category[] = []
) {
  return {
    ...post,
    categories,
    link: `${dateToUrl(createdAt)}/${post.slug}/`,
    createdAtString: dateToString(createdAt),
    excerpt: htmlToText(content).slice(0, excerptLength),
  }
}

export type Category = { id: number; slug: string; name: string }
export type Post = ReturnType<typeof toPost>

export async function findLatestPosts(limit: number) {
  const rows = await db
    .select(postColumns)
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
  const categories = await findCategories(rows.map((row) => row.id))

  return rows.map((row) => toPost(row, categories.get(row.id)))
}

export async function findPost(slug: string) {
  const [row] = await db
    .select(postColumns)
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.slug, slug))
    .limit(1)
  if (!row) return null
  const categories = await findCategories([row.id])

  return { ...toPost(row, categories.get(row.id)), content: row.content }
}
