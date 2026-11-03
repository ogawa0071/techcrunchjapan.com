import { createFileRoute } from '@tanstack/react-router'

import { SearchForm } from '../components/SearchForm'
import { Sidebar } from '../components/Sidebar'
import { seo } from '../lib/seo'

export const Route = createFileRoute('/search/')({
  head: () => seo({ title: '記事検索', path: '/search/', noindex: true }),
  component: SearchIndexPage,
})

function SearchIndexPage() {
  return (
    <div role="main" className="fluid flush split homepage">
      <div className="lc flush lc-island">
        <div className="l-two-col">
          <div className="l-main-container">
            <div className="l-main">
              <header className="page-title lc-padding">
                <h1 className="alpha">記事検索</h1>
                <p>記事タイトルに含まれる語句で検索できます。</p>
                <div style={{ maxWidth: '30em', marginTop: '1em' }}>
                  <SearchForm />
                </div>
              </header>
            </div>
          </div>
          <Sidebar />
        </div>
      </div>
    </div>
  )
}
