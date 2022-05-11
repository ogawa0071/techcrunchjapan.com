import { GetStaticProps } from 'next'
import type { NextPage, InferGetStaticPropsType } from 'next'
import Header from 'components/Header'
import Footer from 'components/Footer'
import GlobalHead from 'components/Head'
import { prisma } from 'lib/prisma'
import { Post } from 'pages/index'
import { default as HomeComponent } from 'components/Home'
import { dateToUrl, dateToString } from 'lib/date'
import { JSDOM } from 'jsdom'

const Search: NextPage<{ posts: Post[] }> = ({ posts }) => {
  return (
    <div>
      <GlobalHead />
      <Header />
      <div>Searchページはアーカイブ作成中です。</div>
      <div>
        <pre>{JSON.stringify(posts, null, 2)}</pre>
      </div>
      <Footer />
    </div>
  )
}

export default Search

export const getStaticProps: GetStaticProps<{
  posts: Post[]
}> = async (context) => {
  const posts = await prisma.post.findMany({
    where: {
      OR: [
        {
          title: {
            contains: context.params?.query as string,
          },
        },
        {
          content: {
            contains: context.params?.query as string,
          },
        },
      ],
    },
    include: {
      author: true,
      categories: {
        include: {
          category: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  })

  return {
    props: {
      posts: posts.map((post) => ({
        ...post,
        link: `${dateToUrl(post.createdAt)}/${post.slug}/`,
        createdAtString: dateToString(post.createdAt),
        updatedAtString: dateToString(post.updatedAt),
        contentString: Array.from(
          new JSDOM(posts[0].content).window.document.body.children
        )
          .map((e) => e.textContent)
          .join(''),
      })),
    },
    revalidate: 60,
  }
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: true,
  }
}
