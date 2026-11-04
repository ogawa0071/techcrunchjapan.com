import { uploadKey } from '../lib/urls'

const DAY = 24 * 60 * 60
const YEAR = 365 * DAY

/** Uploads never change; a missing one is kept for a day only. Anything else: not at all. */
const CACHE_CONTROL: Partial<Record<number, string>> = {
  200: `public, max-age=${YEAR}, immutable`,
  206: `public, max-age=${YEAR}, immutable`,
  304: `public, max-age=${YEAR}, immutable`,
  404: `public, max-age=${DAY}`,
}

/** Request headers for which a part of a file (206) or no body (304) is the answer. */
const PARTIAL_HEADERS = ['range', 'if-none-match', 'if-modified-since']

type ByteRange = { offset: number; length?: number } | { suffix: number }

/** What is used of an R2 object: R2Object, or R2ObjectBody (with `body`). */
interface UploadObject {
  readonly size: number
  readonly httpEtag: string
  readonly uploaded: Date
  readonly httpMetadata?: { contentEncoding?: string }
  readonly body?: ReadableStream
  writeHttpMetadata(headers: Headers): void
}

/** What is used of the R2 binding (R2Bucket) and of the Cache API (Cache). */
export interface UploadBucket {
  get(
    key: string,
    options: { onlyIf: Headers; range?: ByteRange },
  ): Promise<UploadObject | null>
  head(key: string): Promise<{ readonly size: number } | null>
}
export interface UploadCache {
  match(request: Request): Promise<Response | undefined>
  put(request: Request, response: Response): Promise<void>
}

/**
 * Media of the original WordPress site: `/wp-content/uploads/<key>` is the object <key> of
 * the R2 bucket, served on this origin so that article HTML keeps its URLs. The query
 * (e.g. the theme's Jetpack resize parameters) never selects another file.
 *
 * With `cache` (Cache API), each data center keeps complete responses, which then also
 * answer Range and conditional requests; other misses are answered by R2 directly.
 */
export async function serveUpload(
  request: Request,
  bucket: UploadBucket,
  cache: UploadCache | undefined,
  ctx: { waitUntil(promise: Promise<unknown>): void },
): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'GET, HEAD' },
    })
  }
  const url = new URL(request.url)
  const cacheKey = new Request(url.origin + url.pathname)
  const partial = new Headers()
  for (const name of PARTIAL_HEADERS) {
    const value = request.headers.get(name)
    if (value) partial.set(name, value)
  }

  const cached = await cache?.match(new Request(cacheKey, { headers: partial }))
  if (cached) return withEdgeCache(cached, 'HIT')

  const response = await fromBucket(bucket, uploadKey(url.pathname), partial)
  // Files stored compressed (Content-Encoding) come back from the cache compressed twice.
  const cacheable =
    (response.status === 200 || response.status === 404) &&
    !response.headers.has('Content-Encoding')
  if (cache && cacheable) {
    ctx.waitUntil(cache.put(cacheKey, response.clone()))
    return withEdgeCache(response, 'MISS')
  }
  return response
}

async function fromBucket(
  bucket: UploadBucket,
  key: string | undefined,
  partial: Headers,
): Promise<Response> {
  if (key === undefined) return notFound()
  const range = parseRange(partial.get('range'))
  let object: UploadObject | null
  try {
    object = await bucket.get(key, { onlyIf: partial, range })
  } catch (error) {
    // R2 rejects some ranges that start after the end of the file.
    const head = range && (await bucket.head(key).catch(() => null))
    if (head) return rangeNotSatisfiable(head.size)
    console.error('R2 error', key, error)
    return new Response('Service Unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }
  if (!object) return notFound()

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.delete('Expires')
  headers.set('ETag', object.httpEtag)
  headers.set('Last-Modified', object.uploaded.toUTCString())
  headers.set('Accept-Ranges', 'bytes')
  // A failed If-None-Match / If-Modified-Since: the client's copy is current.
  if (!object.body) {
    return new Response(null, {
      status: 304,
      headers: uploadHeaders(headers, 304),
    })
  }

  let status = 200
  if (range) {
    const span = byteSpan(range, object.size)
    if (!span) {
      await object.body.cancel()
      return rangeNotSatisfiable(object.size)
    }
    headers.set(
      'Content-Range',
      `bytes ${span.start}-${span.end}/${object.size}`,
    )
    status = 206
  }
  return new Response(object.body, {
    status,
    headers: uploadHeaders(headers, status),
    // Stored already encoded (Content-Encoding from the object's metadata): send as is.
    encodeBody: object.httpMetadata?.contentEncoding ? 'manual' : 'automatic',
  })
}

/**
 * The byte range of a Range header with a single range (`bytes=0-99`, `bytes=100-`,
 * `bytes=-100`), the kind browsers and media players send. Anything else is ignored, and
 * the whole file is sent.
 */
export function parseRange(header: string | null): ByteRange | undefined {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header?.trim() ?? '')
  if (!match) return undefined
  const [, first = '', last = ''] = match
  const [from, to] = [Number(first), Number(last)]
  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to)) return undefined
  if (first === '') return last === '' ? undefined : { suffix: to }
  if (last === '') return { offset: from }
  return to < from ? undefined : { offset: from, length: to - from + 1 }
}

/** First and last byte of a range of a file, or `undefined` when it has none of them. */
export function byteSpan(
  range: ByteRange,
  size: number,
): { start: number; end: number } | undefined {
  if ('suffix' in range) {
    if (range.suffix === 0 || size === 0) return undefined
    return { start: Math.max(0, size - range.suffix), end: size - 1 }
  }
  if (range.offset >= size) return undefined
  const end =
    range.length === undefined
      ? size - 1
      : Math.min(size, range.offset + range.length) - 1
  return { start: range.offset, end }
}

function rangeNotSatisfiable(size: number): Response {
  return new Response(null, {
    status: 416,
    headers: uploadHeaders(
      new Headers({ 'Content-Range': `bytes */${size}` }),
      416,
    ),
  })
}

function notFound(): Response {
  const headers = new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
  return new Response('Not Found', {
    status: 404,
    headers: uploadHeaders(headers, 404),
  })
}

function uploadHeaders(headers: Headers, status: number): Headers {
  headers.set('Cache-Control', CACHE_CONTROL[status] ?? 'no-store')
  // Uploaded files are data, never active content on this origin (e.g. an SVG or HTML
  // file with scripts in the bucket).
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set(
    'Content-Security-Policy',
    "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
  )
  return headers
}

function withEdgeCache(response: Response, status: 'HIT' | 'MISS'): Response {
  const result = new Response(response.body, response)
  result.headers.set('X-Edge-Cache', status)
  return result
}
