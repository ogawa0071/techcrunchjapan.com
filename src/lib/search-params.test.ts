import { describe, expect, it } from 'vitest'

import { validatePageSearch } from './search-params'

describe('validatePageSearch', () => {
  it('accepts pages above 1', () => {
    expect(validatePageSearch({ page: 2 })).toEqual({ page: 2 })
  })

  it('always sets the key, so invalid raw values are overwritten', () => {
    // The router merges { ...raw, ...validated } before computing loader deps.
    for (const page of [undefined, 1, 0, -3, 1.5, 'abc', true, [2, 3]]) {
      const raw = { page }
      const validated = validatePageSearch(raw)
      expect(validated).toHaveProperty('page', undefined)
      expect({ ...raw, ...validated }.page).toBeUndefined()
    }
  })
})
