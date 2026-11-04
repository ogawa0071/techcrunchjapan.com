import { describe, expect, it } from 'vitest'

import { slugToPathSegment, toStoredSlug, tryDecodeURIComponent } from './slug'

// What TanStack Router hands to loaders: the decoded path segment.
const routerParam = (segment: string) => decodeURIComponent(segment)

describe('slugToPathSegment', () => {
  it('keeps valid slugs verbatim (lowercase escapes included)', () => {
    expect(slugToPathSegment('final')).toBe('final')
    expect(slugToPathSegment('dapper%e3%81%a7weathercom')).toBe(
      'dapper%e3%81%a7weathercom',
    )
  })

  it('escapes only the broken tail of slugs truncated mid-escape', () => {
    expect(slugToPathSegment('abc%e3%81%84%e3%')).toBe('abc%e3%81%84%25e3%25')
    expect(slugToPathSegment('abc%e3%81%84%e')).toBe('abc%e3%81%84%25e')
    expect(slugToPathSegment('abc%e3%81%84%')).toBe('abc%e3%81%84%25')
    expect(slugToPathSegment('abc%e3%81')).toBe('abc%25e3%2581')
  })

  it('handles long slugs with a broken escape in the middle quickly', () => {
    const slug = `${'a'.repeat(7000)}%e3${'a'.repeat(7000)}`
    const started = performance.now()
    expect(slugToPathSegment(slug)).toBe(
      `${'a'.repeat(7000)}%25e3${'a'.repeat(7000)}`,
    )
    expect(performance.now() - started).toBeLessThan(50)
  })

  it('always produces a decodable segment', () => {
    for (const slug of ['abc%e3%', '%e3%81', '%', '%%', 'a%zz']) {
      expect(tryDecodeURIComponent(slugToPathSegment(slug))).toBeDefined()
    }
  })
})

describe('toStoredSlug', () => {
  it.each([
    'final',
    'dapper%e3%81%a7weathercom',
    'abc%e3%81%84%e3%',
    'abc%e3%81%84%e',
    'abc%e3%81%84%',
    'abc%e3%81',
    // ASCII that WordPress stored encoded (one real slug contains `%3a` and `%2f`)
    'campaignfeed%3atechcrunch%2fstartups',
  ])('round-trips %s through its URL and the router', (slug) => {
    expect(toStoredSlug(routerParam(slugToPathSegment(slug)))).toBe(slug)
  })

  it('normalizes decoded or uppercase input to the stored form', () => {
    expect(toStoredSlug('dapperで')).toBe('dapper%e3%81%a7')
    expect(toStoredSlug('FINAL')).toBe('final')
  })

  it('never passes NUL or other non-slug ASCII through literally', () => {
    expect(toStoredSlug('a\u0000b')).toBe('a%00b')
    expect(toStoredSlug('a.b c')).toBe('a%2eb%20c')
  })

  it('rejects lone surrogates', () => {
    expect(toStoredSlug('\ud800')).toBeUndefined()
  })
})
