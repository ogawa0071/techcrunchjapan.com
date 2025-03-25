import { GetStaticProps } from 'next'
import type { NextPage } from 'next'
import prisma from 'lib/prisma'
import Header from 'components/Header'
import Footer from 'components/Footer'
import GlobalHead from 'components/Head'
import Article from 'components/Article'
import {
  Post as _Post,
  Category as _Category,
  CategoriesOnPosts,
  User,
  TagsOnPosts,
  Tag,
} from '@prisma/client'
import ArticleSidebar from 'components/ArticleSidebar'
import { dateToUrl, dateToString } from 'lib/date'
import { useEffect } from 'react'
import { Post } from 'pages/index'
import { JSDOM } from 'jsdom'

const PostPage: NextPage<{
  post: Post
  // latestPosts: Post[]
}> = ({
  post,
  // latestPosts
}) => {
  return (
    <div>
      <GlobalHead
        title={post?.title}
        path={post?.link}
        description={post?.contentString?.slice(0, 270)}
        imagePath={`${post?.featuredMediaUrl}`}
      />
      <Header />
      <Article post={post}>
        {/* <ArticleSidebar post={post} latestPosts={latestPosts} /> */}
      </Article>
      <Footer />
    </div>
  )
}

export default PostPage

export const getStaticProps: GetStaticProps<{
  post: Post
  // latestPosts: Post[]
}> = async (context) => {
  const post =
    typeof context.params?.slug4 === 'string'
      ? await prisma.post.findUnique({
          where: {
            //   AND: [
            // {
            slug: context.params?.slug4,
            //  },
            // {
            //   createdAt: '',
            // },
            //   ],
          },
          include: {
            author: true,
            categories: {
              include: {
                category: true,
              },
            },
            // tags: {
            //   include: {
            //     tag: true,
            //   },
            // },
          },
        })
      : null

  // const latestPosts = await prisma.post.findMany({
  //   include: {
  //     author: true,
  //     categories: {
  //       include: {
  //         category: true,
  //       },
  //     },
  //     tags: {
  //       include: {
  //         tag: true,
  //       },
  //     },
  //   },
  //   take: 20,
  //   orderBy: {
  //     createdAt: 'desc',
  //   },
  // })

  return post
    ? {
        props: {
          post: {
            ...post,
            link: `${dateToUrl(post.createdAt)}/${post.slug}/`,
            createdAtString: dateToString(post.createdAt),
            updatedAtString: dateToString(post.updatedAt),
            contentString: Array.from(
              new JSDOM(post.content).window.document.body.children
            )
              .map((e) => e.textContent)
              .join(''),
          },
          // latestPosts: latestPosts.map((post) => ({
          //   ...post,
          //   link: `${dateToUrl(post.createdAt)}/${post.slug}/`,
          //   createdAtString: dateToString(post.createdAt),
          //   updatedAtString: dateToString(post.updatedAt),
          // })),
        },
        revalidate: 60 * 60 * 24 * 30,
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
