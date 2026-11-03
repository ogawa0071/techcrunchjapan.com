import { createFileRoute } from '@tanstack/react-router'

import { ArchiveLayout } from '../components/ArchiveLayout'
import { SearchForm } from '../components/SearchForm'
import { searchPath, withPage } from '../lib/paths'
import { validatePageSearch } from '../lib/search-params'
import { seo } from '../lib/seo'
import { searchPosts } from '../server/functions'

export const Route = createFileRoute('/search/$query')({
  validateSearch: validatePageSearch,
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ params, deps }) => searchPosts({ data: { query: params.query, page: deps.page } }),
  head: ({ params, loaderData }) =>
    seo({
      title: `「${params.query}」の検索結果`,
      path: withPage(searchPath(params.query), loaderData?.page ?? 1),
      // Search result pages are not worth indexing.
      noindex: true,
    }),
  component: SearchPage,
})

function SearchPage() {
  const { query } = Route.useParams()
  const { posts, page, hasNextPage } = Route.useLoaderData()
  return (
    <ArchiveLayout
      title={`「${query}」の検索結果`}
      posts={posts}
      page={page}
      hasNextPage={hasNextPage}
    >
      <div style={{ maxWidth: '30em', marginTop: '1em' }}>
        <SearchForm key={query} defaultValue={query} />
      </div>
    </ArchiveLayout>
  )
}
