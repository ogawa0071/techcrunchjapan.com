import { env, waitUntil } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'

import type { Database } from '../server/queries.server'

/**
 * Runs `fn` with a database connection for the current request.
 *
 * Workers cannot share sockets between requests, so every call opens a connection
 * through Hyperdrive, which keeps a warm pool to Neon close to the database.
 */
export async function withDb<T>(fn: (db: Database) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: env.HYPERDRIVE.connectionString })
  await client.connect()
  try {
    return await fn(drizzle({ client }))
  } finally {
    waitUntil(client.end())
  }
}
