import { GetStaticProps } from 'next'
import type { NextPage } from 'next'
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

export interface Post extends Post_ {
  author: User
  categories: (CategoriesOnPosts & {
    category: Category
  })[]
  tags: (TagsOnPosts & {
    tag: Tag
  })[]
}

const Home: NextPage<{
  posts: Post[]
}> = ({ posts }) => {
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
    },
    take: 20,
    orderBy: {
      createdAt: 'desc',
    },
  })

  return {
    props: { posts: JSON.parse(JSON.stringify(posts)) },
    notFound: posts ? false : true,
  }
}
