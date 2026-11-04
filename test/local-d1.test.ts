// drizzle.config.ts finds the local D1 database of `bun run dev` by recomputing the file
// name that Miniflare gives it (scripts/lib/local-d1.ts). These tests compare that with
// what wrangler actually does, so that an upgrade that changes it fails here.
import { existsSync, readFileSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { AnyD1Database } from 'drizzle-orm/d1'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPlatformProxy, unstable_readConfig } from 'wrangler'

import { localD1File, stripJsonc } from '../scripts/lib/local-d1'

const CONFIG = fileURLToPath(new URL('../wrangler.jsonc', import.meta.url))
let dir: string

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'techcrunchjapan-local-d1-'))
})

afterAll(async () => {
  await rm(dir, { recursive: true, force: true })
})

/** Creates the local D1 database of a config under `state`, as `bun run dev` would. */
async function touchLocalD1(configPath: string, state: string) {
  const proxy = await getPlatformProxy<{ DB: AnyD1Database }>({
    configPath,
    persist: { path: state },
    remoteBindings: false,
  })
  try {
    await proxy.env.DB.prepare('SELECT 1').run()
  } finally {
    await proxy.dispose()
  }
}

describe('localD1File', () => {
  it('names the file of wrangler.jsonc like wrangler', async () => {
    const state = join(dir, 'project')
    await touchLocalD1(CONFIG, state)
    expect(existsSync(localD1File(CONFIG, state).file)).toBe(true)
  })

  it('follows preview_database_id, then database_id, and skips comments', async () => {
    const config = join(dir, 'wrangler.jsonc')
    await writeFile(
      config,
      `{
        "name": "local-d1-test", // https://example.com/a,b
        "compatibility_date": "2026-11-01",
        /* "d1_databases": [] */
        "d1_databases": [
          {
            "binding": "DB",
            // "database_id": "11111111-1111-1111-1111-111111111111",
            "database_name": "test",
            "database_id": "22222222-2222-2222-2222-222222222222",
            "preview_database_id": "33333333-3333-3333-3333-333333333333",
          },
        ],
      }`,
    )
    const state = join(dir, 'preview')
    await touchLocalD1(config, state)
    const local = localD1File(config, state)
    expect(local.id).toBe('33333333-3333-3333-3333-333333333333')
    expect(existsSync(local.file)).toBe(true)
  })
})

describe('stripJsonc', () => {
  it('reads wrangler.jsonc as wrangler does', () => {
    type Config = { d1_databases: unknown[]; ratelimits: unknown[] }
    const ours: Config = JSON.parse(stripJsonc(readFileSync(CONFIG, 'utf8')))
    const theirs: Config = unstable_readConfig(
      { config: CONFIG },
      { hideWarnings: true },
    )
    expect(ours.d1_databases).toEqual(theirs.d1_databases)
    expect(ours.ratelimits).toEqual(theirs.ratelimits)
  })

  it('keeps comment markers and commas inside strings', () => {
    expect(
      JSON.parse(
        stripJsonc('{ "a": "x // y", "b": "/* z */", "c": [",]", ",}",], }'),
      ),
    ).toEqual({ a: 'x // y', b: '/* z */', c: [',]', ',}'] })
  })
})
