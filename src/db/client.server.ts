import { setResponseStatus } from '@tanstack/react-start/server'
import { env, waitUntil } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'

import type { Database } from '../server/queries.server'

/**
 * Runs `fn` with a database connection for the current request.
 *
 * Workers cannot share sockets between requests, so every call opens a connection
 * through Hyperdrive, which keeps a warm pool to Neon close to the database.
 *
 * Failures answer 503: server-function replies are otherwise 200 (with a serialized
 * error) and would be edge-cached. The original error is only logged, so SQL text and
 * driver messages never reach pages or cached payloads.
 */
export async function withDb<T>(fn: (db: Database) => Promise<T>): Promise<T> {
  const client = new Client({
    connectionString: env.HYPERDRIVE.connectionString,
    connectionTimeoutMillis: 5_000,
    query_timeout: 10_000,
  })
  try {
    await client.connect()
    return await fn(drizzle({ client }))
  } catch (error) {
    console.error('Database error', error)
    setResponseStatus(503)
    throw new Error('Database unavailable', { cause: error })
  } finally {
    waitUntil(client.end())
  }
}
