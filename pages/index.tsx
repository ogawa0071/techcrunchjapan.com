import { GetStaticProps } from 'next'
import type { NextPage, InferGetStaticPropsType } from 'next'
import Header from 'components/Header'
import Footer from 'components/Footer'
import GlobalHead from 'components/Head'
import { prisma } from 'lib/prisma'
import {
  Post as Post_,
  User,
  CategoriesOnPosts,
  Category,
  TagsOnPosts,
  Tag,
} from '@prisma/client'
import { default as HomeComponent } from 'components/Home'
import { dateToUrl, dateToString } from 'lib/date'

export interface Post extends Post_ {
  author: User
  categories: (CategoriesOnPosts & {
    category: Category
  })[]
  tags: (TagsOnPosts & {
    tag: Tag
  })[]
  link: string
  createdAtString: string
  updatedAtString: string
}

const Home: NextPage<{ posts: Post[] }> = ({ posts }) => {
  return (
    <div>
      <GlobalHead />
      <Header />
      <HomeComponent posts={posts} />
      <Footer />
    </div>
  )
}

export default Home

export const getStaticProps: GetStaticProps<{
  posts: Post[]
}> = async (context) => {
  const posts = await prisma.post.findMany({
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

  return {
    props: {
      posts: posts.map((post) => ({
        ...post,
        link: `${dateToUrl(post.createdAt)}/${post.slug}`,
        createdAtString: dateToString(post.createdAt),
        updatedAtString: dateToString(post.updatedAt),
      })),
    },
    revalidate: 60,
  }
}
