import { Link } from '@tanstack/react-router'

import { SearchForm } from './SearchForm'

export function NotFound() {
  return (
    <div role="main" className="fluid">
      <div className="lc lc-padding" style={{ padding: '3em 1em' }}>
        <h1 className="alpha">ページが見つかりませんでした</h1>
        <p>お探しのページは移動または削除された可能性があります。</p>
        <div style={{ maxWidth: '30em', margin: '1.5em 0' }}>
          <SearchForm />
        </div>
        <p>
          <Link to="/">トップページへ戻る</Link>
        </p>
      </div>
    </div>
  )
}
