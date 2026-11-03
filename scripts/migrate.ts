/**
 * Applies the SQL migrations in drizzle/ to DATABASE_URL (`bun run db:migrate`).
 *
 * Same bookkeeping as `drizzle-kit migrate` (drizzle.__drizzle_migrations), but connection
 * and SQL errors are reported instead of being swallowed.
 */
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Client } from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('Environment variable DATABASE_URL is required')
  process.exit(1)
}

const client = new Client({ connectionString })
try {
  await client.connect()
  await migrate(drizzle({ client }), {
    migrationsFolder: new URL('../drizzle', import.meta.url).pathname,
  })
  console.log('Migrations applied')
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  const code =
    error instanceof Error && 'code' in error
      ? ` (code ${String(error.code)})`
      : ''
  console.error(`Migration failed: ${message}${code}`)
  process.exitCode = 1
} finally {
  await client.end()
}
