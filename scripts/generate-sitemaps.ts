/**
 * Regenerates the static sitemaps (`public/sitemap.xml` + one `public/<year>.xml` per year)
 * from the database. The archive is frozen, so they are committed as static assets.
 *
 *   DATABASE_URL=postgresql://... bun run sitemap
 *   SITEMAP_OUT_DIR=/tmp/sitemaps bun run sitemap   # write somewhere else
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { and, desc, gte, lt, max, min } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'

import { posts } from '../src/db/schema'
import { datePath, startOfJstYear } from '../src/lib/date'
import { postPath } from '../src/lib/paths'
import { SITE_ORIGIN } from '../src/lib/site'

const MAX_URLS_PER_SITEMAP = 50_000

const outDir = process.env.SITEMAP_OUT_DIR ?? 'public'
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl)
  throw new Error('Environment variable DATABASE_URL is required')

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll("'", '&apos;')
    .replaceAll('"', '&quot;')
    .replaceAll('>', '&gt;')
    .replaceAll('<', '&lt;')

const jstYear = (date: Date) => Number(datePath(date).slice(1, 5))

const client = new Client({ connectionString: databaseUrl })
await client.connect()
const db = drizzle({ client })

try {
  const [range] = await db
    .select({ first: min(posts.createdAt), last: max(posts.createdAt) })
    .from(posts)
  if (!range?.first || !range.last) throw new Error('The posts table is empty')

  await mkdir(outDir, { recursive: true })
  const index: { loc: string; lastmod: Date }[] = []

  for (let year = jstYear(range.last); year >= jstYear(range.first); year--) {
    const rows = await db
      .select({
        slug: posts.slug,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(
        and(
          gte(posts.createdAt, startOfJstYear(year)),
          lt(posts.createdAt, startOfJstYear(year + 1)),
        ),
      )
      .orderBy(desc(posts.createdAt))
    if (rows.length === 0) continue
    if (rows.length > MAX_URLS_PER_SITEMAP) {
      throw new Error(
        `${year} has ${rows.length} posts; split the sitemap (max ${MAX_URLS_PER_SITEMAP})`,
      )
    }

    const urls = rows.map(
      (row) =>
        `<url><loc>${escapeXml(SITE_ORIGIN + postPath(row))}</loc><lastmod>${row.updatedAt.toISOString()}</lastmod></url>`,
    )
    await writeFile(
      join(outDir, `${year}.xml`),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
    )
    const lastmod = new Date(
      Math.max(...rows.map((row) => row.updatedAt.getTime())),
    )
    index.push({ loc: `${SITE_ORIGIN}/${year}.xml`, lastmod })
    console.log(`${year}.xml: ${rows.length} URLs`)
  }

  const entries = index.map(
    ({ loc, lastmod }) =>
      `  <sitemap>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod.toISOString()}</lastmod>\n  </sitemap>`,
  )
  await writeFile(
    join(outDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</sitemapindex>\n`,
  )
  console.log(`sitemap.xml: ${index.length} sitemaps → ${outDir}`)
} finally {
  await client.end()
}
