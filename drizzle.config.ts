import { createHash, createHmac } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { defineConfig } from 'drizzle-kit'

// `bun run db:generate` writes the SQL migrations to drizzle/ (no database needed); they
// are applied by `bun run db:migrate` (wrangler d1 migrations apply). Do not use
// `drizzle-kit migrate` / `push`: they keep their own migration records.
//
// `bun run db:studio` opens the local D1 database of `bun run dev`. For the production
// database use `bunx wrangler d1 execute DB --remote --command "…"` or the D1 console of
// the Cloudflare dashboard: Studio's local server would accept SQL from any web page.

const LOCAL_D1_DIR = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject'

/**
 * The SQLite file of the local D1 database. Miniflare names it after a Durable Object id
 * derived from preview_database_id ?? database_id ?? binding, so it changes when
 * database_id does. Falls back to the newest file if the naming rule ever changes.
 */
function localD1File(): string | undefined {
  const config = readFileSync('wrangler.jsonc', 'utf8')
  const id =
    /"preview_database_id"\s*:\s*"([^"]+)"/.exec(config)?.[1] ??
    /"database_id"\s*:\s*"([^"]+)"/.exec(config)?.[1] ??
    'DB'
  const key = createHash('sha256').update('miniflare-D1DatabaseObject').digest()
  const name = createHmac('sha256', key).update(id).digest().subarray(0, 16)
  const mac = createHmac('sha256', key).update(name).digest().subarray(0, 16)
  const file = join(
    LOCAL_D1_DIR,
    `${Buffer.concat([name, mac]).toString('hex')}.sqlite`,
  )
  if (existsSync(file)) return file
  let names: string[]
  try {
    names = readdirSync(LOCAL_D1_DIR)
  } catch {
    return undefined
  }
  return names
    .filter((n) => n.endsWith('.sqlite') && n !== 'metadata.sqlite')
    .map((n) => join(LOCAL_D1_DIR, n))
    .toSorted((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0]
}

const localFile = localD1File()

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle',
  verbose: true,
  ...(localFile ? { dbCredentials: { url: localFile } } : {}),
})
