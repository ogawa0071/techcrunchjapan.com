// Generates the yearly sitemaps in `public/`. Run with `bun run sitemap`;
// Bun loads DATABASE_URL from `.env`.

import { and, desc, gte, lt } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import * as fs from 'fs'
import * as path from 'path'
import { posts } from '../db/schema'
import { dateToUrl } from '../src/lib/date'
import { origin } from '../src/lib/site'

const db = drizzle(process.env.DATABASE_URL!)

const years = new Array(2022 - 2006 + 1)
  .fill('')
  .map((_, index) => 2006 + index)

for (const year of years) {
  const _posts = await db
    .select({ slug: posts.slug, createdAt: posts.createdAt })
    .from(posts)
    .where(
      and(
        gte(posts.createdAt, new Date(`${year}-01-01T00:00:00+09:00`)),
        lt(posts.createdAt, new Date(`${year + 1}-01-01T00:00:00+09:00`))
      )
    )
    .orderBy(desc(posts.createdAt))
    .limit(10000)

  const postsXml = _posts.map(
    (post) =>
      `<url><loc>${origin}${dateToUrl(post.createdAt)}/${post.slug
        .replaceAll('&', '&amp;')
        .replaceAll(`'`, '&apos;')
        .replaceAll(`"`, '&quot;')
        .replaceAll('>', '&gt;')
        .replaceAll('<', '&lt;')}/</loc></url>`
  )

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${postsXml.join('\n')}
</urlset>
`

  const _path = `public/${year}.xml`
  await fs.promises.mkdir(path.dirname(_path), { recursive: true })
  await fs.promises.writeFile(_path, xml)
}

await db.$client.end()
