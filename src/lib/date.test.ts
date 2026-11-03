import { describe, expect, it } from 'vitest'

import { datePath, formatDate, jstDateParts, startOfJstYear } from './date'

describe('JST dates', () => {
  // 2022-03-31 00:30 JST is still March 30 in UTC.
  const earlyMorning = new Date('2022-03-30T15:30:00Z')

  it('uses the Japanese calendar day', () => {
    expect(jstDateParts(earlyMorning)).toEqual({ year: '2022', month: '03', day: '31' })
    expect(datePath(earlyMorning)).toBe('/2022/03/31')
    expect(formatDate(earlyMorning)).toBe('2022年3月31日')
  })

  it('matches the previous Intl based implementation', () => {
    const date = new Date('2006-09-24T23:59:59+09:00')
    expect(formatDate(date)).toBe(
      date.toLocaleDateString('ja', {
        year: 'numeric',
        month: 'narrow',
        day: 'numeric',
        timeZone: 'Asia/Tokyo',
      }),
    )
  })

  it('computes JST year boundaries', () => {
    expect(startOfJstYear(2022).toISOString()).toBe('2021-12-31T15:00:00.000Z')
  })
})
