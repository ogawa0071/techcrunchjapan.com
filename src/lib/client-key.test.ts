import { describe, expect, it } from 'vitest'

import { clientKey } from './client-key'

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
