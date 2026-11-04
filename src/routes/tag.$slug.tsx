import { createFileRoute } from '@tanstack/react-router'

import { ArchiveLayout } from '../components/ArchiveLayout'
import { tagPath, withPage } from '../lib/paths'
import { validatePageSearch } from '../lib/search-params'
import { seo } from '../lib/seo'
import { getTagPosts } from '../server/functions'

export const Route = createFileRoute('/tag/$slug')({
  validateSearch: validatePageSearch,
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ params, deps }) =>
    getTagPosts({ data: { slug: params.slug, page: deps.page } }),
  head: ({ loaderData }) =>
    loaderData
      ? seo({
          title: `タグ: ${loaderData.term.name}${loaderData.page > 1 ? ` (${loaderData.page}ページ目)` : ''}`,
          description: loaderData.term.description ?? undefined,
          path: withPage(tagPath(loaderData.term.slug), loaderData.page),
        })
      : {},
  component: TagPage,
})

function TagPage() {
  const { term, posts, page, hasNextPage } = Route.useLoaderData()
  return (
    <ArchiveLayout
      title={`タグ: ${term.name}`}
      description={term.description}
      posts={posts}
      page={page}
      hasNextPage={hasNextPage}
    />
  )
}
