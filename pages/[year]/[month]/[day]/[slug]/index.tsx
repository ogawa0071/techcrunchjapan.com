import { GetStaticProps } from 'next'
import type { NextPage } from 'next'
import { prisma } from 'lib/prisma'
import Header from 'components/Header'
import Footer from 'components/Footer'
import GlobalHead from 'components/Head'
import Article from 'components/Article'
import { Post } from 'pages/index'
import ArticleSidebar from 'components/ArticleSidebar'
import { dateToUrl, dateToString } from 'lib/date'

const PostPage: NextPage<{
  post: Post
  latestPosts: Post[]
}> = ({ post, latestPosts }) => {
  return (
    <div>
      <GlobalHead />
      <Header />
      <Article post={post}>
        <ArticleSidebar post={post} latestPosts={latestPosts} />
      </Article>
      <Footer />
    </div>
  )
}

export default PostPage

export const getStaticProps: GetStaticProps<{
  post: Post
  latestPosts: Post[]
}> = async (context) => {
  const post = await prisma.post.findUnique({
    where: {
      slug: context.params?.slug as string,
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
  })

  const latestPosts = await prisma.post.findMany({
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
    take: 20,
    orderBy: {
      createdAt: 'desc',
    },
  })

  return post
    ? {
        props: {
          post: {
            ...post,
            link: `${dateToUrl(post.createdAt)}/${post.slug}`,
            createdAtString: dateToString(post.createdAt),
            updatedAtString: dateToString(post.updatedAt),
          },
          latestPosts: latestPosts.map((post) => ({
            ...post,
            link: `${dateToUrl(post.createdAt)}/${post.slug}`,
            createdAtString: dateToString(post.createdAt),
            updatedAtString: dateToString(post.updatedAt),
          })),
        },
      }
    : {
        notFound: true,
      }
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: true,
  }
}
