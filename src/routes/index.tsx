import { createFileRoute, Link } from '@tanstack/react-router'

import { HomeIsland } from '../components/HomeIsland'
import { Pagination } from '../components/Pagination'
import { PostRiver } from '../components/PostRiver'
import { Sidebar } from '../components/Sidebar'
import { withPage } from '../lib/paths'
import { validatePageSearch } from '../lib/search-params'
import { seo } from '../lib/seo'
import { getLatestPosts } from '../server/functions'

export const Route = createFileRoute('/')({
  validateSearch: validatePageSearch,
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ deps }) => getLatestPosts({ data: { page: deps.page } }),
  head: ({ loaderData }) => {
    const page = loaderData?.page ?? 1
    return seo({
      title: page > 1 ? `新着記事 (${page}ページ目)` : undefined,
      path: withPage('/', page),
    })
  },
  component: HomePage,
})

function HomePage() {
  const { posts, page, hasNextPage } = Route.useLoaderData()

  return (
    <div role="main" className="fluid flush split homepage">
      <div className="lc flush lc-island">
        <div className="l-two-col">
          <div className="l-main-container">
            <div className="l-main">
              {page === 1 && <HomeIsland posts={posts.slice(0, 4)} />}

              <div className="tuck lc-padding">
                <div className="tabs tabs-large">
                  <ul className="tab-list tabs-no-select">
                    <li className="latest">
                      <Link
                        to="/"
                        activeOptions={{ exact: true }}
                        className="active tabs-no-preventdefault"
                      >
                        新着順
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <PostRiver posts={posts} />
              <Pagination page={page} hasNextPage={hasNextPage} />
            </div>
          </div>
          <Sidebar />
        </div>
      </div>
    </div>
  )
}
