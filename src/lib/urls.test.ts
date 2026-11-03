import { describe, expect, it } from 'vitest'

import { canonicalPath, isFileLike, uploadUrl } from './urls'

describe('canonicalPath', () => {
  it.each([
    ['/', '/'],
    ['/2022/03/31/final/', '/2022/03/31/final/'],
    ['/2022/03/31/final', '/2022/03/31/final/'],
    ['/archives/2022/03/31/final/', '/2022/03/31/final/'],
    ['/archives', '/'],
    ['/archivesfoo/', '/archivesfoo/'],
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
