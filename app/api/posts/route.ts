import { NextResponse } from 'next/server'
import getPrisma from 'lib/prisma'

export const dynamic = 'force-dynamic'
export async function GET() {
  const posts = await getPrisma().post.findMany({
    where: {
      createdAt: {
        gte: new Date('2022-03-31T18:00:00+0900'),
      },
    },
  })

  return NextResponse.json(posts)
}
