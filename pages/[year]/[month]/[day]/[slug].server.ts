import { defineHandler, defineHead, type InferProps } from 'void'
import { findPost } from '../../../../src/lib/posts'
import { siteHead } from '../../../../src/lib/site'

export type Props = InferProps<typeof loader>

export const loader = defineHandler(async (c) => {
  const { year, month, day, slug } = c.req.param()
  const post = await findPost(slug)
  if (!post) return c.notFound()

  // Posts are looked up by slug alone; send other dates to the canonical URL.
  if (!post.link.startsWith(`/${year}/${month}/${day}/`)) {
    return c.redirect(encodeURI(post.link), 308)
  }

  return { post }
})

export const head = defineHead<Props>((_c, { post }) => ({
  ...siteHead({
    title: post.title,
    path: post.link,
    description: post.excerpt,
    imagePath: post.featuredMediaUrl,
  }),
  bodyAttrs: { class: 'single-post' },
}))
