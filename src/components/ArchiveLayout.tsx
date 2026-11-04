import type { ReactNode } from 'react'

import type { PostSummary } from '../server/types'
import { Pagination } from './Pagination'
import { PostRiver } from './PostRiver'
import { Sidebar } from './Sidebar'

/** Layout shared by the category / tag / author / search listings. */
export function ArchiveLayout({
  title,
  description,
  children,
  posts,
  page,
  hasNextPage,
}: {
  title: string
  description?: string | null
  children?: ReactNode
  posts: PostSummary[]
  page: number
  hasNextPage: boolean
}) {
  return (
    <div role="main" className="fluid flush split homepage">
      <div className="lc flush lc-island">
        <div className="l-two-col">
          <div className="l-main-container">
            <div className="l-main">
              <header className="page-title lc-padding">
                <h1 className="alpha">{title}</h1>
                {description && <p>{description}</p>}
                {children}
              </header>
              {posts.length > 0 ? (
                <PostRiver posts={posts} />
              ) : (
                <p className="lc-padding">記事が見つかりませんでした。</p>
              )}
              <Pagination page={page} hasNextPage={hasNextPage} />
            </div>
          </div>
          <Sidebar />
        </div>
      </div>
    </div>
  )
}
