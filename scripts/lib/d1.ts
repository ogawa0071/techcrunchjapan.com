/**
 * The D1 database of wrangler.jsonc (binding DB) for the scripts.
 *
 * - default: the local database that `bun run dev` uses (.wrangler/state)
 * - `--remote`: the production database, through a remote binding (`bunx wrangler login`
 *   first, or CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the environment)
 *
 * The scripts run on Node.js (tsx, see package.json): wrangler's remote bindings do not
 * work under the Bun runtime.
 */
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  drizzle,
  type AnyD1Database,
  type DrizzleD1Database,
} from 'drizzle-orm/d1'
import { getPlatformProxy, unstable_readConfig } from 'wrangler'

export interface D1Connection {
  db: DrizzleD1Database
  /** Human-readable target, for logs. */
  target: string
  close: () => Promise<void>
}

interface WranglerConfig {
  name?: string
  account_id?: string
  compatibility_date?: string
  d1_databases: {
    binding: string
    database_name: string
    database_id?: string
  }[]
}

const PLACEHOLDER_ID = /^[0-]+$/

// Absolute paths: wrangler resolves its defaults against the working directory.
const CONFIG_PATH = fileURLToPath(
  new URL('../../wrangler.jsonc', import.meta.url),
)
/** Where `bun run dev` (the Cloudflare Vite plugin) keeps its local data. */
const LOCAL_STATE = fileURLToPath(
  new URL('../../.wrangler/state/v3', import.meta.url),
)

export async function connectD1(
  remote = process.argv.includes('--remote'),
): Promise<D1Connection> {
  if (!remote) {
    const proxy = await getPlatformProxy<{ DB: AnyD1Database }>({
      configPath: CONFIG_PATH,
      persist: { path: LOCAL_STATE },
      remoteBindings: false,
    })
    return {
      db: drizzle(proxy.env.DB),
      target: 'local D1 database (.wrangler/state)',
      close: proxy.dispose,
    }
  }

  if (process.versions.bun) {
    throw new Error(
      "--remote needs Node.js (wrangler's remote bindings do not work under Bun): run it through `bun run`, which starts the script with Node.js and tsx",
    )
  }
  // (Typed here: wrangler's declaration of the config type does not resolve.)
  const config: WranglerConfig = unstable_readConfig(
    { config: CONFIG_PATH },
    { hideWarnings: true },
  )
  const binding = config.d1_databases.find((d1) => d1.binding === 'DB')
  if (!binding?.database_id || PLACEHOLDER_ID.test(binding.database_id)) {
    throw new Error(
      'Set d1_databases[0].database_id in wrangler.jsonc first (bunx wrangler d1 create techcrunchjapan --location apac --no-update-config)',
    )
  }
  // getPlatformProxy reaches only the bindings marked "remote": a throwaway config marks
  // this one, so that `bun run dev` keeps using the local database. The remote binding
  // runs through a temporary preview Worker, named apart from the production one.
  const accountId = config.account_id ?? process.env.CLOUDFLARE_ACCOUNT_ID
  const dir = await mkdtemp(join(tmpdir(), 'techcrunchjapan-d1-'))
  const removeDir = () => rm(dir, { recursive: true, force: true })
  try {
    const configPath = join(dir, 'wrangler.json')
    await writeFile(
      configPath,
      JSON.stringify({
        name: `${config.name ?? 'techcrunchjapan'}-scripts`,
        ...(accountId ? { account_id: accountId } : {}),
        compatibility_date: config.compatibility_date,
        d1_databases: [
          {
            binding: 'DB',
            database_name: binding.database_name,
            database_id: binding.database_id,
            remote: true,
          },
        ],
      }),
    )
    const proxy = await getPlatformProxy<{ DB: AnyD1Database }>({
      configPath,
      persist: false,
      remoteBindings: true,
    })
    return {
      db: drizzle(proxy.env.DB),
      target: `remote D1 database ${binding.database_name} (${binding.database_id})`,
      close: async () => {
        await proxy.dispose()
        await removeDir()
      },
    }
  } catch (error) {
    await removeDir()
    throw error
  }
}
