import Footer from 'components/Footer'
import Header from 'components/Header'
import HomeComponent from 'components/Home'
import getPrisma from 'lib/prisma'
import { postIncludes, serializePost } from 'lib/posts'

export const dynamic = 'force-dynamic'
export const revalidate = 2592000

export default async function Home() {
  const posts = await getPrisma().post.findMany({
    include: postIncludes,
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  })

  return (
    <div>
      <Header />
      <HomeComponent posts={posts.map(serializePost)} />
      <Footer />
    </div>
  )
}
