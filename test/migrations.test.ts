// The migrations in drizzle/ as D1 runs them (`wrangler d1 migrations apply`): in one
// transaction, with foreign keys enforced. `PRAGMA foreign_keys=OFF` does nothing there, so
// a migration in which drizzle-kit rebuilds a table (DROP TABLE of a parent) fails on D1
// until every OFF/ON pair is rewritten to `PRAGMA defer_foreign_keys` (README, データベース).
import { readdirSync, readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const folder = new URL('../drizzle/', import.meta.url)
const migrations = readdirSync(folder, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

function pragmaProblems(sql: string): string[] {
  const problems: string[] = []
  if (/PRAGMA\s+foreign_keys\s*=/i.test(sql)) {
    problems.push(
      'PRAGMA foreign_keys has no effect on D1: rewrite every OFF to PRAGMA defer_foreign_keys = ON and every ON to PRAGMA defer_foreign_keys = OFF',
    )
  }
  const deferred = Array.from(
    sql.matchAll(/PRAGMA\s+defer_foreign_keys\s*=\s*['"]?(\w+)/gi),
    ([, value = '']) => /^(?:on|true|yes|1)$/i.test(value),
  )
  if (
    deferred.length % 2 !== 0 ||
    deferred.some((on, i) => on !== (i % 2 === 0))
  ) {
    problems.push(
      'every PRAGMA defer_foreign_keys = ON needs its own PRAGMA defer_foreign_keys = OFF',
    )
  }
  return problems
}

// What drizzle-kit 1.0.0-rc.5 writes when it rebuilds two tables (shortened).
const REBUILD = `PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE \`__new_authors\` (\`id\` integer PRIMARY KEY, \`name\` text DEFAULT 'x' NOT NULL);
--> statement-breakpoint
INSERT INTO \`__new_authors\`(\`id\`, \`name\`) SELECT \`id\`, \`name\` FROM \`authors\`;--> statement-breakpoint
DROP TABLE \`authors\`;--> statement-breakpoint
ALTER TABLE \`__new_authors\` RENAME TO \`authors\`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE \`__new_posts\` (\`id\` integer PRIMARY KEY, \`title\` text DEFAULT 't' NOT NULL);
--> statement-breakpoint
INSERT INTO \`__new_posts\`(\`id\`, \`title\`) SELECT \`id\`, \`title\` FROM \`posts\`;--> statement-breakpoint
DROP TABLE \`posts\`;--> statement-breakpoint
ALTER TABLE \`__new_posts\` RENAME TO \`posts\`;--> statement-breakpoint
PRAGMA foreign_keys=ON;`

describe('migrations', () => {
  it('are found', () => {
    expect(migrations.length).toBeGreaterThan(0)
  })

  it.each(migrations)('%s can run on D1', (name) => {
    const sql = readFileSync(new URL(`${name}/migration.sql`, folder), 'utf8')
    expect(pragmaProblems(sql)).toEqual([])
  })

  it('catches table rebuilds that are not rewritten for D1', () => {
    const OFF = 'PRAGMA foreign_keys=OFF;'
    const ON = 'PRAGMA foreign_keys=ON;'
    const DEFER = 'PRAGMA defer_foreign_keys = ON;'
    const UNDEFER = 'PRAGMA defer_foreign_keys = OFF;'
    expect(pragmaProblems(REBUILD)).toHaveLength(1)
    // Only the first pair rewritten: the second rebuild still fails on D1.
    expect(
      pragmaProblems(REBUILD.replace(OFF, DEFER).replace(ON, UNDEFER)),
    ).toHaveLength(1)
    expect(
      pragmaProblems(REBUILD.replaceAll(OFF, DEFER).replaceAll(ON, UNDEFER)),
    ).toEqual([])
  })
})
