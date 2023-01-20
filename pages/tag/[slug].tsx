import type { NextPage, GetStaticProps } from 'next'
import Header from 'components/Header'
import Footer from 'components/Footer'
import GlobalHead from 'components/Head'
import {
  Tag as _Tag,
  TagsOnPosts,
  Post,
  User,
  CategoriesOnPosts,
  Category,
} from '@prisma/client'
import { prisma } from 'lib/prisma'

interface Tag extends _Tag {
  posts: (TagsOnPosts & {
    post: Post & {
      author: User
      categories: (CategoriesOnPosts & {
        category: Category
      })[]
      tags: (TagsOnPosts & {
        tag: _Tag
      })[]
    }
  })[]
}

const TagPage: NextPage<{ tag: Tag }> = ({ tag }) => {
  return (
    <div>
      <GlobalHead />
      <Header />
      <div>Tagページはアーカイブ作成中です。</div>
      <div>
        <pre>{JSON.stringify(tag, null, 2)}</pre>
      </div>
      <Footer />
    </div>
  )
}

export default TagPage

export const getStaticProps: GetStaticProps<{
  tag: Tag
}> = async (context) => {
  const tag = await prisma.tag.findUnique({
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

  return tag
    ? {
        props: {
          tag,
        },
        revalidate: 60 * 60 * 24,
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
