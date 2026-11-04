import { describe, expect, it } from 'vitest'

import { searchWords, toSearchText } from './search'

describe('toSearchText', () => {
  it('folds case beyond ASCII', () => {
    expect(toSearchText('Intel')).toBe('intel')
    expect(toSearchText('École')).toBe('école')
  })

  it('folds full-width and half-width forms (NFKC)', () => {
    expect(toSearchText('ＩＮＴＥＬ　２０２２')).toBe('intel 2022')
    expect(toSearchText('ｶﾀｶﾅ')).toBe('カタカナ')
  })

  it('keeps Japanese text and symbols otherwise', () => {
    expect(toSearchText('資金調達 & <b>"特集"</b>')).toBe(
      '資金調達 & <b>"特集"</b>',
    )
  })
})

describe('searchWords', () => {
  it('splits on any whitespace, including the ideographic space', () => {
    expect(searchWords('  Series　A  round ')).toEqual(['series', 'a', 'round'])
  })

  it('keeps at most five words', () => {
    expect(searchWords('a b c d e f g')).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('returns no words for a blank query', () => {
    expect(searchWords(' 　 ')).toEqual([])
  })
})
