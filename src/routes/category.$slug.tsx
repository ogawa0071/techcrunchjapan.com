import { createFileRoute } from '@tanstack/react-router'

import { ArchiveLayout } from '../components/ArchiveLayout'
import { categoryPath, withPage } from '../lib/paths'
import { validatePageSearch } from '../lib/search-params'
import { seo } from '../lib/seo'
import { getCategoryPosts } from '../server/functions'

export const Route = createFileRoute('/category/$slug')({
  validateSearch: validatePageSearch,
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ params, deps }) => getCategoryPosts({ data: { slug: params.slug, page: deps.page } }),
  head: ({ loaderData }) =>
    loaderData
      ? seo({
          title: `カテゴリー: ${loaderData.term.name}${loaderData.page > 1 ? ` (${loaderData.page}ページ目)` : ''}`,
          description: loaderData.term.description ?? undefined,
          path: withPage(categoryPath(loaderData.term.slug), loaderData.page),
        })
      : {},
  component: CategoryPage,
})

function CategoryPage() {
  const { term, posts, page, hasNextPage } = Route.useLoaderData()
  return (
    <ArchiveLayout
      title={`カテゴリー: ${term.name}`}
      description={term.description}
      posts={posts}
      page={page}
      hasNextPage={hasNextPage}
    />
  )
}
