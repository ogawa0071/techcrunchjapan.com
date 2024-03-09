// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Post } from '@prisma/client'
import prisma from 'lib/prisma'

export default async function assetHandler(
  req: NextApiRequest,
  res: NextApiResponse<Post[] | { error: string }>
) {
  const { method } = req

  switch (method) {
    case 'GET':
      try {
        const posts = await prisma.post.findMany({
          where: {
            createdAt: {
              gte: new Date('2022-03-31T18:00:00+0900'),
            },
          },
        })
        res.status(200).json(posts)
      } catch (e) {
        console.error('Request error', e)
        res.status(500).json({ error: 'Error fetching posts' })
      }
      break
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).end(`Method ${method} Not Allowed`)
      break
  }
}
