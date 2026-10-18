import { posts } from '@schema'
import { defineHandler } from 'void'
import { db, gte } from 'void/db'

export const GET = defineHandler(async () => {
  return await db
    .select()
    .from(posts)
    .where(gte(posts.createdAt, new Date('2022-03-31T18:00:00+0900')))
})
