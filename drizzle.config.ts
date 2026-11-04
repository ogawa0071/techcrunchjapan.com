import { existsSync } from 'node:fs'

import { defineConfig } from 'drizzle-kit'

import { localD1File } from './scripts/lib/local-d1'

// `bun run db:generate` writes the SQL migrations to drizzle/ (no database needed); they
// are applied by `bun run db:migrate` (wrangler d1 migrations apply). Do not use
// `drizzle-kit migrate` / `push`: they keep their own migration records.
//
// `bun run db:studio` opens the local D1 database of `bun run dev`. For the production
// database use `bunx wrangler d1 execute DB --remote --command "…"` or the D1 console of
// the Cloudflare dashboard: Studio's local server would accept SQL from any web page.

const local = localD1File('wrangler.jsonc', '.wrangler/state/v3')
const hasLocalDatabase = existsSync(local.file)

if (!hasLocalDatabase && process.argv.includes('studio')) {
  console.error(
    `There is no local D1 database for database_id ${local.id} yet: run \`bun run db:migrate\` first.`,
  )
  process.exit(1)
}

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle',
  verbose: true,
  ...(hasLocalDatabase ? { dbCredentials: { url: local.file } } : {}),
})
