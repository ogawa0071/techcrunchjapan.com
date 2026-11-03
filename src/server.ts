import handler from '@tanstack/react-start/server-entry'

import { searchPath } from './lib/paths'
import { canonicalPath, isFileLike, uploadUrl } from './lib/urls'

declare global {
  // Route code is isomorphic, so tsconfig keeps the DOM lib, whose CacheStorage type
  // hides the Workers-only `caches.default`.
  interface CacheStorage {
    readonly default: Cache
  }
}

const SERVER_FN_PREFIX = '/_serverFn/'

const DAY = 24 * 60 * 60

/**
 * How long the edge keeps a response, by status. The archive is frozen, so pages are kept
 * as long as the old ISR revalidate (30 days); every deployment starts with a fresh cache.
 * Server-function responses (client-side navigation) are always 200, even for not-found.
 */
const EDGE_TTL: Partial<Record<number, number>> = {
  200: 30 * DAY,
  301: 30 * DAY,
  404: DAY,
}

/**
 * Permanent redirect with a relative Location: correct for every hostname (workers.dev,
 * the production domain) and safe to cache under a host-less cache key.
 */
function redirectTo(location: string): Response {
  return new Response(null, { status: 301, headers: { Location: location } })
}

/**
 * Media of the original WordPress site, stored in R2 (public bucket). Proxied rather
 * than redirected so that article HTML can keep its `/wp-content/uploads/…` URLs.
 */
async function proxyUpload(
  request: Request,
  url: URL,
  env: Env,
): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'GET, HEAD' },
    })
  }
  const upstream = uploadUrl(url.pathname, env.UPLOADS_ORIGIN)
  const headers = new Headers()
  for (const name of ['if-none-match', 'if-modified-since', 'range']) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  const response = await fetch(upstream, {
    method: request.method,
    headers,
    cf: { cacheEverything: true, cacheTtl: 365 * DAY },
  })
  const proxied = new Response(response.body, response)
  if (response.ok)
    proxied.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  return proxied
}

/**
 * Per-data-center cache for SSR documents and GET server-function responses (the data
 * requested on client-side navigation). Keys include the Worker version: HTML cached by a
 * previous deployment would reference /assets/* files that no longer exist.
 */
async function withEdgeCache(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  render: () => Response | Promise<Response>,
): Promise<Response> {
  const keyUrl = new URL(request.url)
  keyUrl.searchParams.set('__version', env.CF_VERSION_METADATA.id)
  const key = new Request(keyUrl, { method: 'GET' })
  const cache = caches.default

  const hit = await cache.match(key)
  if (hit) return forClient(hit, 'HIT')

  const response = await render()
  const ttl = EDGE_TTL[response.status]
  const cacheControl = response.headers.get('Cache-Control') ?? ''
  if (
    !ttl ||
    response.headers.has('Set-Cookie') ||
    /no-store|private/i.test(cacheControl)
  ) {
    return response
  }

  const stored = new Response(response.body, response)
  stored.headers.set('Cache-Control', `public, max-age=${ttl}`)
  ctx.waitUntil(cache.put(key, stored.clone()))
  return forClient(stored, 'MISS')
}

/** Browsers revalidate every time (fresh deployments show up immediately); shared caches may keep it. */
function forClient(response: Response, cacheStatus: 'HIT' | 'MISS'): Response {
  const ttl = EDGE_TTL[response.status] ?? 0
  const result = new Response(response.body, response)
  result.headers.set(
    'Cache-Control',
    `public, max-age=0, s-maxage=${ttl}, must-revalidate`,
  )
  result.headers.set('X-Edge-Cache', cacheStatus)
  return result
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const isRead = request.method === 'GET' || request.method === 'HEAD'

    if (url.pathname.startsWith('/wp-content/uploads/'))
      return proxyUpload(request, url, env)

    if (isRead && !url.pathname.startsWith(SERVER_FN_PREFIX)) {
      // WordPress search URLs (`/?s=…`); also the no-JavaScript fallback of <SearchForm>.
      if (url.pathname === '/' && url.searchParams.has('s')) {
        const query = url.searchParams.get('s')?.trim() ?? ''
        return redirectTo(query ? searchPath(query) : '/search/')
      }

      const canonical = canonicalPath(url.pathname)
      if (canonical !== url.pathname) return redirectTo(canonical + url.search)

      // Existing static files are served before the Worker runs, so a file-like path that
      // gets here does not exist (e.g. /favicon.ico or stale /assets/*.js after a deploy).
      if (isFileLike(url.pathname))
        return new Response('Not Found', { status: 404 })
    }

    if (request.method !== 'GET') return handler.fetch(request)
    return withEdgeCache(request, env, ctx, () => handler.fetch(request))
  },
} satisfies ExportedHandler<Env>
