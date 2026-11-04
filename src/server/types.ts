// Shapes returned by the server functions (shared by server and client code).

export interface CategoryRef {
  id: number
  slug: string
  name: string
}

export interface PostSummary {
  id: number
  slug: string
  title: string
  excerpt: string
  featuredMediaUrl: string | null
  createdAt: Date
  author: { slug: string; name: string }
  categories: CategoryRef[]
}

export interface PostDetail extends PostSummary {
  content: string
  updatedAt: Date
}

export interface Term {
  slug: string
  name: string
  description: string | null
}

export interface PostPage {
  posts: PostSummary[]
  page: number
  hasNextPage: boolean
}

export interface TermPostPage extends PostPage {
  term: Term
}
