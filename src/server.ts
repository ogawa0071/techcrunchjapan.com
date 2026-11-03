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
const YEAR = 365 * DAY

/**
 * How long the edge keeps a response, by status. The archive is frozen, so pages are kept
 * as long as the old ISR revalidate (30 days); every deployment starts with a fresh cache.
 * Server-function replies (client-side navigation) carry notFound / redirect results with
 * status 200; failures get a 5xx status (db/client.server.ts, start.ts) and are not kept.
 */
const EDGE_TTL: Partial<Record<number, number>> = {
  200: 30 * DAY,
  301: 30 * DAY,
  404: DAY,
}

/** Edge TTL of a response, or `undefined` when it must not be cached. */
function edgeTtl(response: Response): number | undefined {
  const ttl = EDGE_TTL[response.status]
  const cacheControl = response.headers.get('Cache-Control') ?? ''
  if (
    response.headers.has('Set-Cookie') ||
    /no-store|private/i.test(cacheControl)
  ) {
    return undefined
  }
  return ttl
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
    // Uploads never change; misses and errors must not be pinned for a year.
    cf: {
      cacheEverything: true,
      cacheTtlByStatus: { '200-299': YEAR, '404': DAY, '500-599': 0 },
    },
  })
  const proxied = new Response(response.body, response)
  proxied.headers.set('X-Content-Type-Options', 'nosniff')
  if (response.ok) {
    proxied.headers.set('Cache-Control', `public, max-age=${YEAR}, immutable`)
  }
  return proxied
}

/**
 * Cache headers of cacheable responses: browsers always revalidate (a new deployment shows
 * up immediately), while the edge keeps the response. `Cloudflare-CDN-Cache-Control` is
 * what Workers Cache uses (and strips) when it is enabled in wrangler.jsonc: stale entries
 * are then re-rendered in the background, like ISR.
 */
function withCacheHeaders(
  response: Response,
  cacheStatus?: 'HIT' | 'MISS',
): Response {
  const ttl = edgeTtl(response)
  if (ttl === undefined) return response
  const result = new Response(response.body, response)
  result.headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
  result.headers.set(
    'Cloudflare-CDN-Cache-Control',
    `public, max-age=${ttl}, stale-while-revalidate=${ttl}`,
  )
  if (cacheStatus) result.headers.set('X-Edge-Cache', cacheStatus)
  return result
}

/**
 * Cache key: the path plus only the query parameters that change the response (`page` for
 * listings, `payload` for server functions), so tracking parameters (utm_*, fbclid, ...)
 * cannot multiply entries or force renders. The Worker version is included because HTML
 * cached by a previous deployment references /assets/* files that no longer exist.
 */
function cacheKey(url: URL, version: string): Request {
  const key = new URL(url.pathname, url.origin)
  const param = url.pathname.startsWith(SERVER_FN_PREFIX) ? 'payload' : 'page'
  const value = url.searchParams.get(param)
  if (value !== null) key.searchParams.set(param, value)
  key.searchParams.set('__version', version)
  return new Request(key, { method: 'GET' })
}

/**
 * Per-data-center cache (Cache API) for SSR documents and GET server-function responses
 * (the data requested on client-side navigation).
 */
async function withCacheApi(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  render: () => Response | Promise<Response>,
): Promise<Response> {
  const key = cacheKey(new URL(request.url), env.CF_VERSION_METADATA.id)
  const cache = caches.default

  const hit = await cache.match(key)
  if (hit) return withCacheHeaders(hit, 'HIT')

  const response = await render()
  const ttl = edgeTtl(response)
  if (ttl === undefined) return response

  const stored = new Response(response.body, response)
  stored.headers.set('Cache-Control', `public, max-age=${ttl}`)
  ctx.waitUntil(cache.put(key, stored.clone()))
  return withCacheHeaders(stored, 'MISS')
}

async function respond(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const url = new URL(request.url)

  if (url.pathname.startsWith('/wp-content/uploads/')) {
    return proxyUpload(request, url, env)
  }

  // A read-only site: every page and server function is a GET.
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'GET, HEAD' },
    })
  }

  if (!url.pathname.startsWith(SERVER_FN_PREFIX)) {
    if (url.pathname === '/') {
      // WordPress search URLs (`/?s=…`); also the no-JavaScript fallback of <SearchForm>.
      if (url.searchParams.has('s')) {
        const query = url.searchParams.get('s')?.trim() ?? ''
        return redirectTo(query ? searchPath(query) : '/search/')
      }
      // WordPress shortlinks (`/?p=<post id>`), resolved by the archives route.
      const id = url.searchParams.get('p')
      if (id && /^\d+$/.test(id)) return redirectTo(`/archives/${id}/`)
    }

    const canonical = canonicalPath(url.pathname)
    if (canonical !== url.pathname) return redirectTo(canonical + url.search)

    // Existing static files are served before the Worker runs, so a file-like path that
    // gets here does not exist (e.g. /favicon.ico or stale /assets/*.js after a deploy).
    if (isFileLike(url.pathname)) {
      return new Response('Not Found', { status: 404 })
    }
  }

  if (env.EDGE_CACHE === 'cache-api') {
    return withCacheApi(request, env, ctx, () => handler.fetch(request))
  }
  return withCacheHeaders(await handler.fetch(request))
}

export default {
  async fetch(request, env, ctx) {
    // HEAD (monitors, link checkers) is answered like GET, from the cache when possible.
    if (request.method !== 'HEAD') return respond(request, env, ctx)
    const response = await respond(
      new Request(request, { method: 'GET' }),
      env,
      ctx,
    )
    return new Response(null, response)
  },
} satisfies ExportedHandler<Env>
