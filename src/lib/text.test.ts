import { describe, expect, it } from 'vitest'

import { truncate } from './text'

describe('truncate', () => {
  it('cuts by characters, never inside a surrogate pair', () => {
    expect(truncate(`${'あ'.repeat(269)}😀い`, 270)).toBe(
      `${'あ'.repeat(269)}😀`,
    )
    expect(truncate('abc', 5)).toBe('abc')
  })
})
