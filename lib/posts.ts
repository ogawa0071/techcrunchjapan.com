import { JSDOM } from 'jsdom'
import { dateToString, dateToUrl } from 'lib/date'

export type Post = {
  id: number
  slug: string
  createdAt: string
  updatedAt: string
  title: string
  content: string
  authorId: number
  featuredMediaUrl: string | null
  author: {
    id: number
    slug: string
    name: string
    description: string | null
  }
  categories: {
    postId: number
    categoryId: number
    category: {
      id: number
      slug: string
      name: string
      description: string | null
    }
  }[]
  link: string
  createdAtString: string
  updatedAtString: string
  contentString?: string
}

type PostWithRelations = Omit<
  Post,
  'createdAt' | 'updatedAt' | 'link' | 'createdAtString' | 'updatedAtString' | 'contentString'
> & {
  createdAt: Date
  updatedAt: Date
}

export function serializePost(post: PostWithRelations): Post {
  return {
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    link: `${dateToUrl(post.createdAt)}/${post.slug}/`,
    createdAtString: dateToString(post.createdAt),
    updatedAtString: dateToString(post.updatedAt),
    contentString: Array.from(
      new JSDOM(post.content).window.document.body.children
    )
      .map((e) => e.textContent)
      .join(''),
  }
}

export const postIncludes = {
  author: true,
  categories: {
    include: {
      category: true,
    },
  },
} as const
