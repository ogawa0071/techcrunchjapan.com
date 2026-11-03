import { defaultParseSearch } from '@tanstack/react-router'

import { validatePageSearch } from './search-params'
import { slugToPathSegment } from './slug'

const UPLOADS_PREFIX = '/wp-content/uploads/'

/**
 * Returns the decoded path or `undefined`. The result must be used: Vite 8 (Rolldown)
 * treats decodeURI as pure and removes calls whose result is unused, even in try/catch.
 */
function tryDecodeURI(path: string): string | undefined {
  try {
    return decodeURI(path)
  } catch {
    return undefined
  }
}

/**
 * The last path segment contains a dot (`/favicon.ico`, `/assets/x.js`). Search queries
 * may contain dots (`/search/node.js`), so they never count as files.
 */
export function isFileLike(pathname: string): boolean {
  if (pathname.startsWith('/search/')) return false
  return pathname.slice(pathname.lastIndexOf('/') + 1).includes('.')
}

/**
 * All legacy / canonical URL fixes in one place, so that clients get at most one 301:
 * - repeated slashes are collapsed (the router's own redirect for them is a 307).
 * - `/archives/YYYY/MM/DD/…` (WordPress) → `/YYYY/MM/DD/…`. `/archives/<slug or id>/`, the
 *   older permalink format without a date, is kept: the archives route looks it up.
 * - slugs truncated mid-escape (`…%e3%`) get the `%` of their broken tail escaped as `%25`,
 *   exactly like the canonical URLs (lib/slug.ts). TanStack Start answers 400 to paths it
 *   cannot decode, and could not hydrate them either.
 * - a missing trailing slash is added (TanStack's own redirect for it is a 307).
 */
export function canonicalPath(pathname: string): string {
  let path = pathname.replace(/\/{2,}/g, '/')
  if (path === '/archives' || path.startsWith('/archives/')) {
    const rest = path.slice('/archives'.length)
    if (rest.split('/').filter(Boolean).length !== 1) path = rest || '/'
  }
  if (tryDecodeURI(path) === undefined)
    path = path.split('/').map(slugToPathSegment).join('/')
  if (!path.endsWith('/') && !isFileLike(path)) path += '/'
  return path
}

/**
 * R2 URL of a `/wp-content/uploads/…` request. Only the path is copied, so the host can
 * never change (`/wp-content/uploads//evil.com/x` must not become a protocol-relative URL).
 * R2 ignores the Jetpack resize parameters (`?w=…&h=…&crop=1`) used by the theme, so the
 * query is dropped and every size shares one cached object.
 */
export function uploadUrl(pathname: string, origin: string): URL {
  const url = new URL(origin)
  url.pathname = `/${pathname.slice(UPLOADS_PREFIX.length).replace(/^\/+/, '')}`
  return url
}

/**
 * The query string that determines a response: `?payload=…` for server functions and
 * `?page=N` (N > 1) for listings, parsed exactly as the router does, so that duplicated
 * or oddly encoded parameters map to the page that is actually rendered. Everything
 * else (utm_*, fbclid, ...) is irrelevant to the output.
 */
export function canonicalSearch(url: URL): string {
  if (url.pathname.startsWith('/_serverFn/')) {
    const payload = url.searchParams.get('payload')
    return payload === null ? '' : `?${new URLSearchParams({ payload })}`
  }
  const { page } = validatePageSearch(defaultParseSearch(url.search))
  return page ? `?page=${page}` : ''
}

/**
 * The canonical URL for requests to `www.` or over plain HTTP on the production host
 * (`origin`), or `undefined` when the request is already there (or is another host such
 * as workers.dev or localhost).
 */
export function canonicalOriginUrl(
  url: URL,
  origin: string,
): string | undefined {
  const site = new URL(origin)
  const isWww = url.hostname === `www.${site.hostname}`
  const isPlainHttp = url.hostname === site.hostname && url.protocol === 'http:'
  return isWww || isPlainHttp
    ? `${site.origin}${url.pathname}${url.search}`
    : undefined
}
