import { GetStaticProps } from 'next'
import type { NextPage } from 'next'
import { prisma } from 'lib/prisma'
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

interface Category extends _Category {
  posts: (CategoriesOnPosts & {
    post: _Post & {
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

const Slug: NextPage<
  | {
      type: 'category'
      category: Category
    }
  | {
      type: 'post'
      post: Post
      latestPosts: Post[]
    }
> = (props) => {
  switch (props.type) {
    case 'category':
      return (
        <div>
          <GlobalHead />
          <Header />
          <div>Categoryページはアーカイブ作成中です。</div>
          <div>
            <pre>{JSON.stringify(props.category, null, 2)}</pre>
          </div>
          <Footer />
        </div>
      )
      break

    case 'post':
      return (
        <div>
          <GlobalHead />
          <Header />
          <Article post={props.post}>
            <ArticleSidebar post={props.post} latestPosts={props.latestPosts} />
          </Article>
          <Footer />
        </div>
      )
      break
  }
}

export default Slug

export const getStaticProps: GetStaticProps<
  | {
      type: 'category'
      category: Category
    }
  | {
      type: 'post'
      post: Post
      latestPosts: Post[]
    }
> = async (context) => {
  const slug = context.params?.slug?.slice(-1)[0]

  // Page Query

  const category = await prisma.category.findUnique({
    where: {
      slug,
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
      },
    },
  })

  const post = await prisma.post.findUnique({
    where: {
      slug,
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

  if (category) {
    return {
      props: {
        type: 'category',
        category,
      },
    }
  }

  if (post) {
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

    return {
      props: {
        type: 'post',
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
      revalidate: 60,
    }
  }

  // 404
  return {
    notFound: true,
  }
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: true,
  }
}
