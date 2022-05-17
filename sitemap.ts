import * as fs from 'fs'
import { prisma } from './lib/prisma'
import { dateToUrl } from './lib/date'
import type { Post } from '@prisma/client'
import * as path from 'path'

const host = 'https://techcrunchjapan.com'

;(async () => {
  let posts: {
    [key: string]: { slug: string; createdAt: Date; updatedAt: Date }[]
  } = {}

  // for (
  //   let index = 0;
  //   index < Math.ceil((await prisma.post.count()) / 10000);
  //   index++
  // ) {

  const years = new Array(2022 - 2006 + 1)
    .fill('')
    .map((_, index) => 2006 + index)

  for (const year of years) {
    const _posts = await prisma.post.findMany({
      select: {
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        createdAt: {
          gte: `${year}-01-01T00:00:00+09:00`,
          lt: `${year + 1}-01-01T00:00:00+09:00`,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10000,
    })

    posts = { ...posts, [year]: _posts }
  }

  // }

  for (const [year, _posts] of Object.entries(posts)) {
    const postsXml = _posts.map(
      (post) =>
        `<url><loc>${host}${dateToUrl(post.createdAt)}/${post.slug
          .replaceAll('&', '&amp;')
          .replaceAll(`'`, '&apos;')
          .replaceAll(`"`, '&quot;')
          .replaceAll('>', '&gt;')
          .replaceAll('<', '&lt;')}/</loc></url>`
    )

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${postsXml.join('\n')}
</urlset>`

    const _path = `public/${year}/sitemap.xml`
    await fs.promises.mkdir(path.dirname(_path), { recursive: true })
    await fs.promises.writeFile(_path, xml)
  }
})()
