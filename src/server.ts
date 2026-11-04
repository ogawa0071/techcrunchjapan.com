import handler from '@tanstack/react-start/server-entry'

import { searchPath } from './lib/paths'
import { SITE_ORIGIN } from './lib/site'
import {
  canonicalOriginUrl,
  canonicalPath,
  canonicalSearch,
  isFileLike,
} from './lib/urls'
import { serveUpload } from './server/uploads.server'

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

/** Real paths are short (slugs ≤ 200 bytes); longer ones are not worth any work. */
const MAX_PATH_LENGTH = 2048

/** Same policy as the previous host (Vercel): two years. */
const HSTS = `max-age=${2 * YEAR}`

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
 * `www.` and plain-HTTP requests go to the canonical HTTPS origin. Never cached: Workers
 * Cache keys ignore the host and scheme, so a cached cross-origin redirect would loop.
 */
function canonicalOriginRedirect(url: URL): Response | undefined {
  const location = canonicalOriginUrl(url, SITE_ORIGIN)
  if (!location) return undefined
  return new Response(null, {
    status: 301,
    headers: { Location: location, 'Cache-Control': 'no-store' },
  })
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
  result.headers.set('Cache-Control', 'public, max-age=0')
  result.headers.set(
    'Cloudflare-CDN-Cache-Control',
    `public, max-age=${ttl}, stale-while-revalidate=${ttl}`,
  )
  if (cacheStatus) result.headers.set('X-Edge-Cache', cacheStatus)
  return result
}

/**
 * Per-data-center cache (Cache API) for SSR documents and GET server-function responses
 * (the data requested on client-side navigation). `request` is already normalized, so
 * its URL is the key; the Worker version is added because HTML cached by a previous
 * deployment references /assets/* files that no longer exist.
 */
async function withCacheApi(
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
  if (hit) return withCacheHeaders(hit, 'HIT')

  const response = await render()
  const ttl = edgeTtl(response)
  if (ttl === undefined) return response

  const stored = new Response(response.body, response)
  stored.headers.set('Cache-Control', `public, max-age=${ttl}`)
  ctx.waitUntil(cache.put(key, stored.clone()))
  return withCacheHeaders(stored, 'MISS')
}

/**
 * Pages are rendered from a normalized URL (path + the parameters that matter), so a
 * response depends only on its cache key. A redirect still gets the visitor's original
 * query string (e.g. utm_*), added per request and never stored.
 */
function withOriginalQuery(response: Response, url: URL): Response {
  const location = response.headers.get('Location')
  if (
    !url.search ||
    response.status < 300 ||
    response.status >= 400 ||
    !location?.startsWith('/') ||
    location.includes('?')
  ) {
    return response
  }
  const result = new Response(response.body, response)
  result.headers.set('Location', location + url.search)
  return result
}

async function respond(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const url = new URL(request.url)

  const originRedirect = canonicalOriginRedirect(url)
  if (originRedirect) return originRedirect

  if (url.pathname.length > MAX_PATH_LENGTH) {
    return new Response('URI Too Long', { status: 414 })
  }

  if (url.pathname.startsWith('/wp-content/uploads/')) {
    const cache = env.EDGE_CACHE === 'cache-api' ? caches.default : undefined
    return serveUpload(request, env.UPLOADS, cache, ctx)
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
      if (id && /^\d+$/.test(id)) {
        const rest = new URLSearchParams(url.searchParams)
        rest.delete('p')
        const query = rest.toString()
        return redirectTo(`/archives/${id}/${query ? `?${query}` : ''}`)
      }
    }

    const canonical = canonicalPath(url.pathname)
    if (canonical !== url.pathname) return redirectTo(canonical + url.search)

    // Existing static files are served before the Worker runs, so a file-like path that
    // gets here does not exist (e.g. /favicon.ico or stale /assets/*.js after a deploy).
    if (isFileLike(url.pathname)) {
      return new Response('Not Found', { status: 404 })
    }
  }

  const normalized = new Request(
    new URL(url.pathname + canonicalSearch(url), url.origin),
    request,
  )
  const response =
    env.EDGE_CACHE === 'cache-api'
      ? await withCacheApi(normalized, env, ctx, () =>
          handler.fetch(normalized),
        )
      : withCacheHeaders(await handler.fetch(normalized))
  return withOriginalQuery(response, url)
}

export default {
  async fetch(request, env, ctx) {
    // HEAD (monitors, link checkers) is answered like GET, from the cache when possible.
    const isHead = request.method === 'HEAD'
    const response = await respond(
      isHead ? new Request(request, { method: 'GET' }) : request,
      env,
      ctx,
    )
    const result = new Response(isHead ? null : response.body, response)
    if (new URL(request.url).protocol === 'https:') {
      result.headers.set('Strict-Transport-Security', HSTS)
    }
    return result
  },
} satisfies ExportedHandler<Env>
