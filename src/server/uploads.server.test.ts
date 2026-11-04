import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  byteSpan,
  parseRange,
  serveUpload,
  type UploadBucket,
  type UploadCache,
} from './uploads.server'

describe('parseRange', () => {
  it.each([
    ['bytes=0-99', { offset: 0, length: 100 }],
    ['bytes=100-', { offset: 100 }],
    ['bytes=-100', { suffix: 100 }],
    [' bytes=5-5 ', { offset: 5, length: 1 }],
  ])('reads %s', (header, range) => {
    expect(parseRange(header)).toEqual(range)
  })

  it.each([
    null,
    '',
    'bytes=-',
    'bytes=abc',
    'bytes=0-0,5-6',
    'bytes=100-50',
    'items=0-99',
    'bytes=99999999999999999999-',
  ])('ignores %s', (header) => {
    expect(parseRange(header)).toBeUndefined()
  })
})

describe('byteSpan', () => {
  it.each([
    [
      { offset: 0, length: 100 },
      { start: 0, end: 99 },
    ],
    [
      { offset: 250, length: 100 },
      { start: 250, end: 299 },
    ],
    [{ offset: 10 }, { start: 10, end: 299 }],
    [{ suffix: 100 }, { start: 200, end: 299 }],
    [{ suffix: 1000 }, { start: 0, end: 299 }],
  ])('%o of 300 bytes is %o', (range, span) => {
    expect(byteSpan(range, 300)).toEqual(span)
  })

  it.each([{ offset: 300 }, { offset: 400, length: 1 }, { suffix: 0 }])(
    '%o of 300 bytes is not satisfiable',
    (range) => {
      expect(byteSpan(range, 300)).toBeUndefined()
    },
  )
})

const UPLOADED = new Date('2023-05-12T00:00:00Z')
const PNG = new Uint8Array(300).map((_, i) => i % 256)

interface File {
  bytes: Uint8Array<ArrayBuffer>
  contentType: string
  contentEncoding?: string
}

/**
 * Like the R2 binding: honours If-None-Match, returns the requested range, and rejects
 * ranges that start after the end of the file.
 */
function fakeBucket(files: Record<string, File>, failing = false) {
  const requested: string[] = []
  const bucket: UploadBucket = {
    get(key, { onlyIf, range }) {
      requested.push(key)
      if (failing) return Promise.reject(new Error('R2 is down'))
      const file = files[key]
      if (!file) return Promise.resolve(null)
      const { bytes, contentType, contentEncoding } = file
      const object = {
        size: bytes.length,
        httpEtag: `"${encodeURIComponent(key)}"`,
        uploaded: UPLOADED,
        httpMetadata: { contentEncoding },
        writeHttpMetadata(headers: Headers) {
          headers.set('Content-Type', contentType)
          headers.set('Cache-Control', 'max-age=60')
          if (contentEncoding) headers.set('Content-Encoding', contentEncoding)
        },
      }
      if (onlyIf.get('if-none-match') === object.httpEtag) {
        return Promise.resolve(object)
      }
      let part = bytes
      if (range && 'suffix' in range) {
        part = bytes.slice(Math.max(0, bytes.length - range.suffix))
      } else if (range) {
        if (range.offset >= bytes.length) {
          return Promise.reject(new Error('InvalidRange'))
        }
        part = bytes.slice(
          range.offset,
          range.length === undefined ? undefined : range.offset + range.length,
        )
      }
      return Promise.resolve({ ...object, body: new Blob([part]).stream() })
    },
    head(key) {
      const file = files[key]
      return Promise.resolve(file ? { size: file.bytes.length } : null)
    },
  }
  return { bucket, requested }
}

/** Keeps responses by URL (Cloudflare's cache also answers Range and conditionals). */
function fakeCache() {
  const stored = new Map<string, Response>()
  const cache: UploadCache = {
    match(request) {
      return Promise.resolve(stored.get(request.url)?.clone())
    },
    put(request, response) {
      stored.set(request.url, response)
      return Promise.resolve()
    },
  }
  return { cache, stored }
}

const pending: Promise<unknown>[] = []
const ctx = {
  waitUntil: (promise: Promise<unknown>) => void pending.push(promise),
}

async function get(
  path: string,
  { bucket, cache }: { bucket: UploadBucket; cache?: UploadCache },
  init?: RequestInit,
) {
  const response = await serveUpload(
    new Request(`https://techcrunchjapan.com/wp-content/uploads/${path}`, init),
    bucket,
    cache,
    ctx,
  )
  await Promise.all(pending.splice(0))
  return response
}

const files: Record<string, File> = {
  '2022/03/画像.png': { bytes: PNG, contentType: 'image/png' },
  '2020/05/data.json': {
    bytes: new Uint8Array([0x1f, 0x8b, 1, 2]),
    contentType: 'application/json',
    contentEncoding: 'gzip',
  },
}
const IMAGE = '2022/03/%E7%94%BB%E5%83%8F.png'

describe('serveUpload', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('serves a file and keeps it in the cache, whatever the query', async () => {
    const { bucket, requested } = fakeBucket(files)
    const { cache, stored } = fakeCache()
    const response = await get(`${IMAGE}?w=300&h=200`, { bucket, cache })
    expect(response.status).toBe(200)
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(PNG)
    expect(Object.fromEntries(response.headers)).toMatchObject({
      'content-type': 'image/png',
      etag: '"2022%2F03%2F%E7%94%BB%E5%83%8F.png"',
      'last-modified': 'Fri, 12 May 2023 00:00:00 GMT',
      'accept-ranges': 'bytes',
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
      'x-edge-cache': 'MISS',
    })
    expect(response.headers.get('content-security-policy')).toContain('sandbox')
    expect([...stored.keys()]).toEqual([
      `https://techcrunchjapan.com/wp-content/uploads/${IMAGE}`,
    ])

    const again = await get(IMAGE, { bucket, cache })
    expect(again.headers.get('x-edge-cache')).toBe('HIT')
    expect(requested).toHaveLength(1)
  })

  it('caches missing files for a day', async () => {
    const { bucket } = fakeBucket(files)
    const { cache, stored } = fakeCache()
    const response = await get('2022/03/missing.png', { bucket, cache })
    expect(response.status).toBe(404)
    expect(response.headers.get('cache-control')).toBe('public, max-age=86400')
    expect(stored.size).toBe(1)
  })

  it('does not ask R2 for paths that name no object', async () => {
    const { bucket, requested } = fakeBucket(files)
    expect((await get('', { bucket })).status).toBe(404)
    expect((await get('%E3%81.png', { bucket })).status).toBe(404)
    expect(requested).toEqual([])
  })

  it('answers a range from R2 without caching it', async () => {
    const { bucket } = fakeBucket(files)
    const { cache, stored } = fakeCache()
    const response = await get(
      IMAGE,
      { bucket, cache },
      { headers: { Range: 'bytes=-100' } },
    )
    expect(response.status).toBe(206)
    expect(response.headers.get('content-range')).toBe('bytes 200-299/300')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(PNG.slice(200))
    expect(stored.size).toBe(0)
  })

  it.each(['bytes=300-', 'bytes=-0'])(
    'answers an unsatisfiable range (%s) with 416',
    async (range) => {
      const { bucket } = fakeBucket(files)
      const { cache, stored } = fakeCache()
      const response = await get(
        IMAGE,
        { bucket, cache },
        { headers: { Range: range } },
      )
      expect(response.status).toBe(416)
      expect(response.headers.get('content-range')).toBe('bytes */300')
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(stored.size).toBe(0)
    },
  )

  it('sends the whole file for ranges it does not support', async () => {
    const { bucket } = fakeBucket(files)
    const response = await get(
      IMAGE,
      { bucket },
      { headers: { Range: 'bytes=0-0,5-6' } },
    )
    expect(response.status).toBe(200)
    expect((await response.arrayBuffer()).byteLength).toBe(300)
  })

  it('answers a current If-None-Match with 304', async () => {
    const { bucket } = fakeBucket(files)
    const { cache, stored } = fakeCache()
    const response = await get(
      IMAGE,
      { bucket, cache },
      { headers: { 'If-None-Match': '"2022%2F03%2F%E7%94%BB%E5%83%8F.png"' } },
    )
    expect(response.status).toBe(304)
    expect(response.headers.get('etag')).toBe(
      '"2022%2F03%2F%E7%94%BB%E5%83%8F.png"',
    )
    expect(stored.size).toBe(0)
  })

  it('sends files stored compressed as they are, without caching them', async () => {
    const { bucket } = fakeBucket(files)
    const { cache, stored } = fakeCache()
    const response = await get('2020/05/data.json', { bucket, cache })
    expect(response.headers.get('content-encoding')).toBe('gzip')
    expect(stored.size).toBe(0)
  })

  it('fails with 503 when R2 does, without caching it', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { bucket } = fakeBucket(files, true)
    const { cache, stored } = fakeCache()
    const response = await get(IMAGE, { bucket, cache })
    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(stored.size).toBe(0)
  })

  it('only serves GET (HEAD arrives as GET)', async () => {
    const { bucket } = fakeBucket(files)
    const response = await get(IMAGE, { bucket }, { method: 'POST' })
    expect(response.status).toBe(405)
    expect(response.headers.get('allow')).toBe('GET, HEAD')
  })

  it('works without a cache (Workers Cache in front)', async () => {
    const { bucket } = fakeBucket(files)
    const response = await get(IMAGE, { bucket })
    expect(response.status).toBe(200)
    expect(response.headers.has('x-edge-cache')).toBe(false)
  })
})
