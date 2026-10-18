import { defineConfig } from 'void/config'
import { siteHead } from './src/lib/site'

const month = 60 * 60 * 24 * 30
// Site-wide defaults; pages with content override them in `head()`.
const { title, meta = [] } = siteHead()

export default defineConfig({
  // TiDB Serverless (MySQL compatible), connected through Hyperdrive in production.
  database: 'mysql',
  worker: {
    compatibility_date: '2026-02-24',
  },
  cloudflare: {
    name: 'techcrunchjapan',
  },
  head: {
    title,
    htmlAttrs: { lang: 'ja' },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width' },
      ...meta,
    ],
    link: [
      {
        rel: 'icon',
        href: '/wp-content/uploads/2021/05/cropped-logo_tc-1.png',
      },
      { rel: 'stylesheet', href: '/index.css' },
    ],
  },
  routing: {
    // The archive no longer changes, so rendered pages are cached at the edge.
    // Uploads are proxied from R2 and cached by the proxy itself instead.
    revalidate: { '/wp-content/uploads/*': 0, '*': month },
    redirects: {
      '/archives': '/',
      '/archives/*': { to: '/:splat', status: 307 },
    },
  },
})
