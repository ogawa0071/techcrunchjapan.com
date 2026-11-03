import {
  createFileRoute,
  redirect,
  type AnyRouter,
} from '@tanstack/react-router'

import { Article } from '../components/Article'
import { authorPath, postPath } from '../lib/paths'
import { jsonLd, seo } from '../lib/seo'
import { absoluteUrl, EXCERPT_DISPLAY_LENGTH, SITE_NAME } from '../lib/site'
import { getPost } from '../server/functions'

const DATE_PARAMS = { year: /^\d{4}$/, month: /^\d{2}$/, day: /^\d{2}$/ }

export const Route = createFileRoute('/$year/$month/$day/$slug')({
  // Only /YYYY/MM/DD/slug/ is an article URL; anything else is a plain 404 (no DB query).
  params: {
    parse: (params) =>
      DATE_PARAMS.year.test(params.year) &&
      DATE_PARAMS.month.test(params.month) &&
      DATE_PARAMS.day.test(params.day)
        ? params
        : false,
  },
  staticData: { bodyClass: 'single-post' },
  loader: async ({ params, location }) => {
    const result = await getPost({ data: params })
    if ('redirectTo' in result) {
      throw redirect<AnyRouter>({
        href: result.redirectTo + location.searchStr,
        statusCode: 301,
      })
    }
    return result.post
  },
  head: ({ loaderData: post }) => {
    if (!post) return {}
    const path = postPath(post)
    const { meta, links } = seo({
      title: post.title,
      description: post.excerpt.slice(0, EXCERPT_DISPLAY_LENGTH),
      path,
      image: post.featuredMediaUrl,
      type: 'article',
    })
    return {
      meta: [
        ...meta,
        {
          property: 'article:published_time',
          content: post.createdAt.toISOString(),
        },
        {
          property: 'article:modified_time',
          content: post.updatedAt.toISOString(),
        },
      ],
      links,
      scripts: [
        {
          type: 'application/ld+json',
          children: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: post.title,
            mainEntityOfPage: absoluteUrl(path),
            datePublished: post.createdAt.toISOString(),
            dateModified: post.updatedAt.toISOString(),
            ...(post.featuredMediaUrl && {
              image: [absoluteUrl(post.featuredMediaUrl)],
            }),
            author: [
              {
                '@type': 'Person',
                name: post.author.name,
                url: absoluteUrl(authorPath(post.author.slug)),
              },
            ],
            publisher: { '@type': 'Organization', name: SITE_NAME },
          }),
        },
      ],
    }
  },
  component: PostPage,
})

function PostPage() {
  const post = Route.useLoaderData()
  return <Article post={post} />
}
