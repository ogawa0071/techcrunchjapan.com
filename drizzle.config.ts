import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { defineConfig } from 'drizzle-kit'

// `bun run db:generate` writes the SQL migrations to drizzle/ (no database needed); they
// are applied by `bun run db:migrate` (wrangler d1 migrations apply). Do not use
// `drizzle-kit migrate` / `push`: they keep their own migration records.
//
// `bun run db:studio` opens the local D1 database of `bun run dev`;
// `bun run db:studio:remote` the production one through the Cloudflare API
// (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, and CLOUDFLARE_D1_TOKEN with D1 edit
// permission).

const LOCAL_D1_DIR = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject'

/** The SQLite file behind the local D1 database (created by `bun run db:migrate`). */
function localD1File(): string | undefined {
  let names: string[]
  try {
    names = readdirSync(LOCAL_D1_DIR)
  } catch {
    return undefined
  }
  return names
    .filter((name) => name.endsWith('.sqlite') && name !== 'metadata.sqlite')
    .map((name) => join(LOCAL_D1_DIR, name))
    .toSorted((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0]
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Environment variable ${name} is required`)
  return value
}

const common = {
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle',
  verbose: true,
} as const

const localFile = localD1File()

export default process.env.DRIZZLE_REMOTE === '1'
  ? defineConfig({
      ...common,
      driver: 'd1-http',
      dbCredentials: {
        accountId: requireEnv('CLOUDFLARE_ACCOUNT_ID'),
        databaseId: requireEnv('CLOUDFLARE_DATABASE_ID'),
        token: requireEnv('CLOUDFLARE_D1_TOKEN'),
      },
    })
  : defineConfig({
      ...common,
      ...(localFile ? { dbCredentials: { url: localFile } } : {}),
    })
