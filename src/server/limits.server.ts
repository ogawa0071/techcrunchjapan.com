import {
  getRequestHeader,
  setResponseHeader,
  setResponseStatus,
} from '@tanstack/react-start/server'
import { env } from 'cloudflare:workers'

import { clientKey, withinLimits } from '../lib/rate-limit'

/** From this page on, a listing makes D1 read over 1,000 rows (skipped rows count too). */
export const DEEP_PAGE = 50

/**
 * D1 bills every row a query reads and runs one query at a time. Queries that can read the
 * whole title index (a title search without matches: ~65k rows) or skip many rows (deep
 * listing pages) are therefore limited per client and in total, per Cloudflare location
 * (ratelimits in wrangler.jsonc). Only cache misses get here.
 *
 * Over the limit, the request fails with 429, which the edge cache does not keep.
 */
export async function limitExpensiveQuery(): Promise<void> {
  const key = clientKey(getRequestHeader('cf-connecting-ip'))
  if (
    await withinLimits(env.QUERY_LIMIT_PER_CLIENT, env.QUERY_LIMIT_TOTAL, key)
  ) {
    return
  }
  setResponseStatus(429)
  setResponseHeader('Retry-After', '60')
  setResponseHeader('Cache-Control', 'no-store')
  throw new Error('Too many requests')
}
