/**
 * Rate-limit key of a client address (`cf-connecting-ip`): the IPv4 address, or the /64
 * prefix of an IPv6 address (one subscriber usually holds a whole /64).
 */
export function clientKey(ip: string | undefined): string {
  if (!ip) return 'unknown'
  // IPv4, also when written as an IPv4-mapped IPv6 address (::ffff:192.0.2.1).
  if (ip.includes('.')) return ip.slice(ip.lastIndexOf(':') + 1)
  if (!ip.includes(':')) return ip
  const [head = '', tail] = ip.toLowerCase().split('::')
  const headParts = head ? head.split(':') : []
  const tailParts = tail ? tail.split(':') : []
  const groups =
    tail === undefined
      ? headParts
      : [
          ...headParts,
          ...Array<string>(
            Math.max(0, 8 - headParts.length - tailParts.length),
          ).fill('0'),
          ...tailParts,
        ]
  const prefix = groups
    .slice(0, 4)
    .map((group) => group.replace(/^0+(?=.)/, ''))
    .join(':')
  return `${prefix}::/64`
}
