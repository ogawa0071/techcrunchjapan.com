import type { NextPage, GetStaticProps } from 'next'
import Header from 'components/Header'
import Footer from 'components/Footer'
import GlobalHead from 'components/Head'
import {
  Tag,
  TagsOnPosts,
  Post,
  User as _User,
  CategoriesOnPosts,
  Category,
} from '@prisma/client'
import prisma from 'lib/prisma'

interface User extends _User {
  posts: (Post & {
    categories: (CategoriesOnPosts & {
      category: Category
    })[]
    tags: (TagsOnPosts & {
      tag: Tag
    })[]
  })[]
}

const Author: NextPage<{
  // user: User
}> = (
  {
    // user
  }
) => {
  return (
    <div>
      <GlobalHead />
      <Header />
      <div>Authorページはアーカイブ作成中です。</div>
      <div>{/* <pre>{JSON.stringify(user, null, 2)}</pre> */}</div>
      <Footer />
    </div>
  )
}

export default Author

// export const getStaticProps: GetStaticProps<{
//   user: User
// }> = async (context) => {
//   const user = await prisma.user.findUnique({
//     where: {
//       slug: context.params?.slug as string,
//     },
//     include: {
//       posts: {
//         include: {
//           categories: {
//             include: {
//               category: true,
//             },
//           },
//           tags: {
//             include: {
//               tag: true,
//             },
//           },
//         },
//         orderBy: {
//           createdAt: 'desc',
//         },
//         take: 100,
//       },
//     },
//   })

//   return user
//     ? {
//         props: {
//           user,
//         },
//         revalidate: 60 * 60 * 24,
//       }
//     : {
//         notFound: true,
//       }
// }

// export async function getStaticPaths() {
//   return {
//     paths: [],
//     fallback: true,
//   }
// }
