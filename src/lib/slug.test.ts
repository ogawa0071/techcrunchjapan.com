import { describe, expect, it } from 'vitest'

import { slugToPathSegment, toStoredSlug, tryDecodeURIComponent } from './slug'

// What TanStack Router hands to loaders: the decoded path segment.
const routerParam = (segment: string) => decodeURIComponent(segment)

describe('slugToPathSegment', () => {
  it('keeps valid slugs verbatim (lowercase escapes included)', () => {
    expect(slugToPathSegment('final')).toBe('final')
    expect(slugToPathSegment('dapper%e3%81%a7weathercom')).toBe('dapper%e3%81%a7weathercom')
  })

  it('escapes only the broken tail of slugs truncated mid-escape', () => {
    expect(slugToPathSegment('abc%e3%81%84%e3%')).toBe('abc%e3%81%84%25e3%25')
    expect(slugToPathSegment('abc%e3%81%84%e')).toBe('abc%e3%81%84%25e')
    expect(slugToPathSegment('abc%e3%81%84%')).toBe('abc%e3%81%84%25')
    expect(slugToPathSegment('abc%e3%81')).toBe('abc%25e3%2581')
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
  ])('round-trips %s through its URL and the router', (slug) => {
    expect(toStoredSlug(routerParam(slugToPathSegment(slug)))).toBe(slug)
  })

  it('normalizes decoded or uppercase input to the stored form', () => {
    expect(toStoredSlug('dapperで')).toBe('dapper%e3%81%a7')
    expect(toStoredSlug('FINAL')).toBe('final')
  })

  it('rejects lone surrogates', () => {
    expect(toStoredSlug('\ud800')).toBeUndefined()
  })
})
