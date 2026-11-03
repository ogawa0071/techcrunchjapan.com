import { describe, expect, it } from 'vitest'

import {
  categoryPath,
  postLink,
  postPath,
  thumbnailUrl,
  withPage,
} from './paths'

const post = {
  slug: 'dapper%e3%81%a7weathercom',
  createdAt: new Date('2006-09-24T03:00:00Z'),
}

describe('paths', () => {
  it('builds canonical article paths with the stored slug', () => {
    expect(postPath(post)).toBe('/2006/09/24/dapper%e3%81%a7weathercom/')
    expect(postPath({ ...post, slug: 'abc%e3%' })).toBe(
      '/2006/09/24/abc%25e3%25/',
    )
  })

  it('passes decoded params to the router (it re-encodes them)', () => {
    expect(postLink(post).params).toEqual({
      year: '2006',
      month: '09',
      day: '24',
      slug: 'dapperでweathercom',
    })
    expect(postLink({ ...post, slug: 'abc%e3%' }).params.slug).toBe('abc%e3%')
  })

  it('builds term paths and page links', () => {
    expect(categoryPath('%e8%b3%87%e9%87%91')).toBe(
      '/category/%e8%b3%87%e9%87%91/',
    )
    expect(withPage('/tag/a/', 1)).toBe('/tag/a/')
    expect(withPage('/tag/a/', 3)).toBe('/tag/a/?page=3')
  })

  it('falls back to the placeholder thumbnail', () => {
    expect(thumbnailUrl(null, 210, 158)).toMatch(/210x210\.png$/)
    expect(thumbnailUrl('/wp-content/uploads/a.jpg', 210, 158)).toBe(
      '/wp-content/uploads/a.jpg?w=210&h=158&crop=1',
    )
  })
})
