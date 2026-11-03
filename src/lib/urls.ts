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

/** The last path segment contains a dot (`/favicon.ico`, `/assets/x.js`). */
export function isFileLike(pathname: string): boolean {
  return pathname.slice(pathname.lastIndexOf('/') + 1).includes('.')
}

/**
 * All legacy / canonical URL fixes in one place, so that clients get at most one 301:
 * - `/archives/…` (WordPress) → `/…`
 * - slugs truncated mid-escape (`…%e3%`) get the `%` of their broken tail escaped as `%25`,
 *   exactly like the canonical URLs (lib/slug.ts). TanStack Start answers 400 to paths it
 *   cannot decode, and could not hydrate them either.
 * - a missing trailing slash is added (TanStack's own redirect for it is a 307).
 */
export function canonicalPath(pathname: string): string {
  let path = pathname
  if (path === '/archives' || path.startsWith('/archives/')) {
    path = path.slice('/archives'.length) || '/'
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
