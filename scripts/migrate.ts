/**
 * Applies the SQL migrations in drizzle/ to DATABASE_URL (`bun run db:migrate`).
 *
 * Same bookkeeping as `drizzle-kit migrate` (drizzle.__drizzle_migrations), but connection
 * and SQL errors are reported instead of being swallowed.
 */
import { fileURLToPath } from 'node:url'

import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Client } from 'pg'

import { describeError } from './lib/errors'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('Environment variable DATABASE_URL is required')
  process.exit(1)
}

const client = new Client({ connectionString })
client.on('error', () => {}) // reported through the failing query
try {
  await client.connect()
  await migrate(drizzle({ client }), {
    migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
  })
  console.log('Migrations applied')
} catch (error) {
  console.error(`Migration failed: ${describeError(error)}`)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
