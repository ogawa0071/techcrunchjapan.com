import type { NextPage, GetStaticProps } from 'next'
import Header from 'components/Header'
import Footer from 'components/Footer'
import GlobalHead from 'components/Head'
import {
  Tag,
  TagsOnPosts,
  Post,
  User,
  CategoriesOnPosts,
  Category as _Category,
} from '@prisma/client'
import { prisma } from 'lib/prisma'

interface Category extends _Category {
  posts: (CategoriesOnPosts & {
    post: Post & {
      author: User
      categories: (CategoriesOnPosts & {
        category: _Category
      })[]
      tags: (TagsOnPosts & {
        tag: Tag
      })[]
    }
  })[]
}

const CategoryPage: NextPage<{ category: Category }> = ({ category }) => {
  return (
    <div>
      <GlobalHead />
      <Header />
      <div>Categoryページはアーカイブ作成中です。</div>
      <div>
        <pre>{JSON.stringify(category, null, 2)}</pre>
      </div>
      <Footer />
    </div>
  )
}

export default CategoryPage

export const getStaticProps: GetStaticProps<{
  category: Category
}> = async (context) => {
  const category = await prisma.category.findUnique({
    where: {
      slug: context.params?.slug as string,
    },
    include: {
      posts: {
        include: {
          post: {
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
          },
        },
        orderBy: {
          post: {
            createdAt: 'desc',
          },
        },
        take: 100,
      },
    },
  })

  return category
    ? {
        props: {
          category,
        },
        revalidate: 60,
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
