import { withPage } from '../lib/paths'
import { SiteLink } from './SiteLink'

export function Pagination({
  basePath,
  page,
  hasNextPage,
}: {
  /** Path of the first page; further pages add `?page=N`. */
  basePath: string
  page: number
  hasNextPage: boolean
}) {
  if (page <= 1 && !hasNextPage) return null

  return (
    <nav aria-label="ページ送り" className="lc-padding">
      <ul className="pagination">
        {page > 1 && (
          <li>
            <SiteLink href={withPage(basePath, page - 1)} rel="prev">
              &laquo; 新しい記事
            </SiteLink>
          </li>
        )}
        {hasNextPage && (
          <li>
            <SiteLink href={withPage(basePath, page + 1)} rel="next">
              過去の記事 &raquo;
            </SiteLink>
          </li>
        )}
      </ul>
    </nav>
  )
}
