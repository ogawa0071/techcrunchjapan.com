import { defineHandler, defineHead, type InferProps } from 'void'
import { findLatestPosts } from '../src/lib/posts'
import { siteHead } from '../src/lib/site'

export type Props = InferProps<typeof loader>

export const loader = defineHandler(async () => {
  return { posts: await findLatestPosts(20) }
})

export const head = defineHead<Props>(() => siteHead())
