import {
  createRootRoute,
  HeadContent,
  Link,
  Scripts,
  useMatches,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { ADSENSE_SCRIPT } from '../components/AdSlot'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { NotFound } from '../components/NotFound'
import { SITE_DESCRIPTION, SITE_NAME } from '../lib/site'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      // Defaults; pages override title / description / OGP (see lib/seo.ts).
      { title: SITE_NAME },
      { name: 'description', content: SITE_DESCRIPTION },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:locale', content: 'ja_JP' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'robots', content: 'max-image-preview:large' },
    ],
    links: [
      { rel: 'icon', href: '/wp-content/uploads/2021/05/cropped-logo_tc-1.png' },
      // The original theme stylesheet (static asset in public/).
      { rel: 'stylesheet', href: '/index.css' },
    ],
    scripts: [{ src: ADSENSE_SCRIPT, async: true, crossOrigin: 'anonymous' }],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
  errorComponent: ErrorPage,
})

function RootDocument({ children }: { children: ReactNode }) {
  // e.g. `single-post` on article pages, rendered on the server to avoid a style flash.
  const bodyClass = useMatches({
    select: (matches) =>
      matches
        .map((match) => match.staticData.bodyClass)
        .filter(Boolean)
        .join(' '),
  })

  return (
    <html lang="ja">
      <head>
        <HeadContent />
      </head>
      <body className={bodyClass || undefined}>
        <div>
          <Header />
          {children}
          <Footer />
        </div>
        <Scripts />
      </body>
    </html>
  )
}

function ErrorPage({ reset }: ErrorComponentProps) {
  return (
    <div role="main" className="fluid">
      <div className="lc lc-padding" style={{ padding: '3em 1em' }}>
        <h1 className="alpha">エラーが発生しました</h1>
        <p>しばらくしてから再度お試しください。</p>
        <p>
          <button type="button" onClick={reset}>
            再読み込み
          </button>{' '}
          <Link to="/">トップページへ戻る</Link>
        </p>
      </div>
    </div>
  )
}
