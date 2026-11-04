import { setResponseStatus } from '@tanstack/react-start/server'
import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/d1'

import type { Database } from '../server/queries.server'

/**
 * Runs `fn` with the D1 database.
 *
 * Queries go through a D1 session that may be answered by a read replica (when read
 * replication is enabled on the database): the archive never changes, so every replica
 * is up to date.
 *
 * Failures answer 503: server-function replies are otherwise 200 (with a serialized
 * error) and would be edge-cached. The original error is only logged, so SQL text and
 * driver messages never reach pages or cached payloads.
 */
export async function withDb<T>(fn: (db: Database) => Promise<T>): Promise<T> {
  try {
    return await fn(drizzle(env.DB.withSession('first-unconstrained')))
  } catch (error) {
    console.error('Database error', error)
    setResponseStatus(503)
    throw new Error('Database unavailable', { cause: error })
  }
}
