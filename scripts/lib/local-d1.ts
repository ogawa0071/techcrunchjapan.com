/**
 * Where the local D1 database lives. Plain Node.js (no wrangler import), so that
 * drizzle.config.ts can use it: drizzle-kit cannot load wrangler.
 */
import { createHash, createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

interface D1Binding {
  binding: string
  database_id?: string
  preview_database_id?: string
}

const STRING = '"(?:[^"\\\\]|\\\\.)*"'
const COMMENTS = new RegExp(`(${STRING})|//[^\\n]*|/\\*[\\s\\S]*?\\*/`, 'g')
const TRAILING_COMMAS = new RegExp(`(${STRING})|,(?=\\s*[}\\]])`, 'g')

const keepStrings = (_match: string, string?: string) => string ?? ''

/** JSON with comments and trailing commas (like wrangler.jsonc) as plain JSON. */
export function stripJsonc(text: string): string {
  return text
    .replace(COMMENTS, keepStrings)
    .replace(TRAILING_COMMAS, keepStrings)
}

/**
 * The SQLite file of the local D1 database (binding DB) in a wrangler state directory
 * (.wrangler/state/v3 for `bun run dev`, `bun run db:migrate` and the scripts). Miniflare
 * stores the database as a Durable Object named after preview_database_id ?? database_id
 * ?? binding, so the file changes with database_id (test/local-d1.test.ts checks this
 * against wrangler).
 */
export function localD1File(
  configPath: string,
  stateDir: string,
): { id: string; file: string } {
  const config: { d1_databases?: D1Binding[] } = JSON.parse(
    stripJsonc(readFileSync(configPath, 'utf8')),
  )
  const db = config.d1_databases?.find((d1) => d1.binding === 'DB')
  const id = db?.preview_database_id ?? db?.database_id ?? 'DB'
  const key = createHash('sha256').update('miniflare-D1DatabaseObject').digest()
  const name = createHmac('sha256', key).update(id).digest().subarray(0, 16)
  const mac = createHmac('sha256', key).update(name).digest().subarray(0, 16)
  return {
    id,
    file: join(
      stateDir,
      'd1',
      'miniflare-D1DatabaseObject',
      `${Buffer.concat([name, mac]).toString('hex')}.sqlite`,
    ),
  }
}
