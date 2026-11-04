import { describe, expect, it } from 'vitest'

import {
  canonicalOriginUrl,
  canonicalPath,
  canonicalSearch,
  isFileLike,
  uploadUrl,
} from './urls'

describe('canonicalPath', () => {
  it.each([
    ['/', '/'],
    ['/2022/03/31/final/', '/2022/03/31/final/'],
    ['/2022/03/31/final', '/2022/03/31/final/'],
    ['/archives/2022/03/31/final/', '/2022/03/31/final/'],
    ['/archives', '/'],
    ['/archives/', '/'],
    ['/archivesfoo/', '/archivesfoo/'],
    // dateless legacy permalinks are resolved by the archives route
    [
      '/archives/20110128communifactory-gets-180m-yen',
      '/archives/20110128communifactory-gets-180m-yen/',
    ],
    ['/archives/12345/', '/archives/12345/'],
    ['/2022//03/31/final/', '/2022/03/31/final/'],
    ['/category//fundraising', '/category/fundraising/'],
    ['/search/node.js', '/search/node.js/'],
    ['/2006/09/24/dapper%e3%81%a7x/', '/2006/09/24/dapper%e3%81%a7x/'],
    // truncated mid-escape: only the broken tail is escaped (one hop, trailing slash added)
    [
      '/archives/2007/12/17/abc%e3%81%84%e3%',
      '/2007/12/17/abc%e3%81%84%25e3%25/',
    ],
    ['/2007/12/17/abc%e/', '/2007/12/17/abc%25e/'],
    ['/ads.txt', '/ads.txt'],
  ])('%s → %s', (input, expected) => {
    expect(canonicalPath(input)).toBe(expected)
  })

  it('is idempotent', () => {
    for (const path of ['/2007/12/17/abc%e3%81%84%e3%', '/archives/x', '/a']) {
      expect(canonicalPath(canonicalPath(path))).toBe(canonicalPath(path))
    }
  })
})

describe('isFileLike', () => {
  it('looks at the last segment only', () => {
    expect(isFileLike('/favicon.ico')).toBe(true)
    expect(isFileLike('/assets/index-abc.js')).toBe(true)
    expect(isFileLike('/v1.0/page/')).toBe(false)
    expect(isFileLike('/search/node.js')).toBe(false)
  })
})

/** Path as produced by `new URL(request.url).pathname`. */
const pathOf = (raw: string) =>
  new URL(`https://techcrunchjapan.com${raw}`).pathname

describe('uploadUrl', () => {
  const origin = 'https://r2.techcrunchjapan.com/'

  it('maps uploads to the bucket and drops resize parameters', () => {
    expect(
      uploadUrl(pathOf('/wp-content/uploads/2022/03/a.jpg'), origin).toString(),
    ).toBe('https://r2.techcrunchjapan.com/2022/03/a.jpg')
  })

  it.each([
    '/wp-content/uploads///evil.com/x.png',
    '/wp-content/uploads//\\evil.com/x.png',
  ])('never leaves the bucket host (%s)', (raw) => {
    expect(uploadUrl(pathOf(raw), origin).host).toBe('r2.techcrunchjapan.com')
  })
})

const search = (query: string, path = '/') =>
  canonicalSearch(new URL(`https://techcrunchjapan.com${path}${query}`))

describe('canonicalSearch', () => {
  it('keeps only the parameters that change the output', () => {
    expect(search('')).toBe('')
    expect(search('?page=2&utm_source=x&fbclid=y')).toBe('?page=2')
    expect(search('?page=1')).toBe('')
    expect(search('?page=abc')).toBe('')
    expect(search('?payload=%7B%7D&x=1', '/_serverFn/abc')).toBe(
      '?payload=%7B%7D',
    )
  })

  it('follows the router when parameters are duplicated or oddly written', () => {
    // The router renders page 1 for a repeated `page`, so it must share page 1's entry.
    expect(search('?page=2&page=3')).toBe('')
    expect(search('?page=02')).toBe('?page=2')
  })
})

describe('canonicalOriginUrl', () => {
  const origin = 'https://techcrunchjapan.com'
  const redirect = (url: string) => canonicalOriginUrl(new URL(url), origin)

  it('sends www and plain HTTP to the HTTPS apex, keeping path and query', () => {
    expect(
      redirect('https://www.techcrunchjapan.com/2022/03/31/final/?a=1'),
    ).toBe('https://techcrunchjapan.com/2022/03/31/final/?a=1')
    expect(redirect('http://techcrunchjapan.com/')).toBe(
      'https://techcrunchjapan.com/',
    )
  })

  it('applies the path fixes in the same hop', () => {
    expect(
      redirect('http://www.techcrunchjapan.com/category/startups?utm=1'),
    ).toBe('https://techcrunchjapan.com/category/startups/?utm=1')
  })

  it('leaves the canonical origin and other hosts alone', () => {
    expect(redirect('https://techcrunchjapan.com/')).toBeUndefined()
    expect(redirect('http://localhost:5173/')).toBeUndefined()
    expect(
      redirect('https://techcrunchjapan.example.workers.dev/'),
    ).toBeUndefined()
  })
})
