import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Article from 'components/Article'
import { origin, siteName } from 'components/Head'
import Footer from 'components/Footer'
import Header from 'components/Header'
import getPrisma from 'lib/prisma'
import { postIncludes, serializePost } from 'lib/posts'

export const dynamic = 'force-dynamic'
type Params = Promise<{
  slug1: string
  slug2: string
  slug3: string
  slug4: string
}>

export const revalidate = 2592000

async function getPost(slug: string) {
  const post = await getPrisma().post.findUnique({
    where: {
      slug,
    },
    include: postIncludes,
  })

  return post ? serializePost(post) : null
}

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { slug4 } = await params
  const post = await getPost(slug4)

  if (!post) {
    return {}
  }

  const description = post.contentString?.slice(0, 270)

  return {
    title: post.title,
    description,
    alternates: {
      canonical: post.link,
    },
    openGraph: {
      url: `${origin}${post.link}`,
      title: `${post.title} | ${siteName}`,
      description,
      images: post.featuredMediaUrl ? [post.featuredMediaUrl] : undefined,
    },
  }
}

export default async function PostPage({ params }: { params: Params }) {
  const { slug4 } = await params
  const post = await getPost(slug4)

  if (!post) {
    notFound()
  }

  return (
    <div>
      <Header />
      <Article post={post} />
      <Footer />
    </div>
  )
}
