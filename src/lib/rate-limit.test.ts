import { describe, expect, it } from 'vitest'

import { clientKey, withinLimits } from './rate-limit'

describe('clientKey', () => {
  it('keeps IPv4 addresses', () => {
    expect(clientKey('192.0.2.1')).toBe('192.0.2.1')
    expect(clientKey('::ffff:192.0.2.1')).toBe('192.0.2.1')
  })

  it('reduces IPv6 addresses to their /64', () => {
    expect(clientKey('2001:db8:1:2:3:4:5:6')).toBe('2001:db8:1:2::/64')
    expect(clientKey('2001:DB8:0001:0002::5')).toBe('2001:db8:1:2::/64')
    expect(clientKey('2001:db8::1')).toBe('2001:db8:0:0::/64')
    expect(clientKey('::1')).toBe('0:0:0:0::/64')
  })

  it('groups every address of one /64', () => {
    expect(clientKey('2001:db8:1:2:aaaa::1')).toBe(
      clientKey('2001:db8:1:2:bbbb:cccc:dddd:eeee'),
    )
  })

  it('has a key for requests without an address', () => {
    expect(clientKey(undefined)).toBe('unknown')
    expect(clientKey('')).toBe('unknown')
  })
})

/** Like the Workers binding (and Miniflare's): counts each call allowed in the window. */
function limiter(limit: number) {
  const counts = new Map<string, number>()
  return {
    counts,
    limit: ({ key }: { key: string }) => {
      const count = counts.get(key) ?? 0
      if (count >= limit) return Promise.resolve({ success: false })
      counts.set(key, count + 1)
      return Promise.resolve({ success: true })
    },
  }
}

describe('withinLimits', () => {
  it('allows requests under both limits', async () => {
    const perClient = limiter(2)
    const total = limiter(3)
    expect(await withinLimits(perClient, total, 'a')).toBe(true)
    expect(await withinLimits(perClient, total, 'a')).toBe(true)
    expect(await withinLimits(perClient, total, 'a')).toBe(false)
    expect(await withinLimits(perClient, total, 'b')).toBe(true)
    expect(await withinLimits(perClient, total, 'c')).toBe(false)
  })

  it('does not count requests over the client limit toward the total', async () => {
    const perClient = limiter(2)
    const total = limiter(3)
    await Promise.all(
      Array.from({ length: 10 }, () => withinLimits(perClient, total, 'a')),
    )
    expect(total.counts.get('total')).toBe(2)
    expect(await withinLimits(perClient, total, 'b')).toBe(true)
  })
})
