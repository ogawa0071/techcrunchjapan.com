import { createFileRoute } from '@tanstack/react-router'

import { ArchiveLayout } from '../components/ArchiveLayout'
import { authorPath, withPage } from '../lib/paths'
import { validatePageSearch } from '../lib/search-params'
import { seo } from '../lib/seo'
import { getAuthorPosts } from '../server/functions'

export const Route = createFileRoute('/author/$slug')({
  validateSearch: validatePageSearch,
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ params, deps }) => getAuthorPosts({ data: { slug: params.slug, page: deps.page } }),
  head: ({ loaderData }) =>
    loaderData
      ? seo({
          title: `${loaderData.term.name} の記事${loaderData.page > 1 ? ` (${loaderData.page}ページ目)` : ''}`,
          description: loaderData.term.description ?? undefined,
          path: withPage(authorPath(loaderData.term.slug), loaderData.page),
        })
      : {},
  component: AuthorPage,
})

function AuthorPage() {
  const { term, posts, page, hasNextPage } = Route.useLoaderData()
  return (
    <ArchiveLayout
      title={`${term.name} の記事`}
      description={term.description}
      posts={posts}
      page={page}
      hasNextPage={hasNextPage}
    />
  )
}
