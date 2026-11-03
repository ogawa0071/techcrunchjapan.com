import { Link } from '@tanstack/react-router'

/** Previous / next page links for the current listing (`?page=N`, omitted for page 1). */
export function Pagination({ page, hasNextPage }: { page: number; hasNextPage: boolean }) {
  if (page <= 1 && !hasNextPage) return null

  return (
    <nav aria-label="ページ送り" className="lc-padding">
      <ul className="pagination">
        {page > 1 && (
          <li>
            <Link to="./" search={{ page: page > 2 ? page - 1 : undefined }} rel="prev">
              &laquo; 新しい記事
            </Link>
          </li>
        )}
        {hasNextPage && (
          <li>
            <Link to="./" search={{ page: page + 1 }} rel="next">
              過去の記事 &raquo;
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
