import * as fs from 'fs'
import { prisma } from './lib/prisma'
import { dateToUrl } from './lib/date'
import type { Post } from '@prisma/client'

const host = 'https://techcrunchjapan.com'

;(async () => {
  let posts: { slug: string; createdAt: Date; updatedAt: Date }[] = []

  for (
    let index = 0;
    index < Math.ceil((await prisma.post.count()) / 10000);
    index++
  ) {
    const _posts = await prisma.post.findMany({
      select: {
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10000,
    })

    posts = [...posts, ..._posts]
  }

  const postsXml = posts.map(
    (post) =>
      `<url><loc>${host}${dateToUrl(post.createdAt)}${
        post.slug
      }/</loc><lastmod>${post.updatedAt.toISOString()}</lastmod></url>`
  )

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${postsXml.join('\n')}
</urlset>`

  await fs.promises.writeFile('public/sitemap.xml', xml)
})()
