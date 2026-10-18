import { sql } from 'void/db'
import {
  datetime,
  index,
  int,
  longtext,
  mysqlTable,
  primaryKey,
  text,
  varchar,
} from 'void/schema-mysql'

// The tables were created by Prisma, so the table and column names follow its
// conventions. Relations are resolved in queries; there are no foreign keys.

export const posts = mysqlTable(
  'Post',
  {
    id: int('id').autoincrement().primaryKey(), // id
    slug: varchar('slug', { length: 191 }).notNull().unique('Post_slug_key'), // slug
    createdAt: datetime('createdAt', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`), // date_gmt
    updatedAt: datetime('updatedAt', { mode: 'date', fsp: 3 }).notNull(), // modified_gmt
    title: text('title').notNull(), // title
    content: longtext('content').notNull(), // content.rendered
    authorId: int('authorId').notNull(), // author
    featuredMediaUrl: varchar('featuredMediaUrl', { length: 191 }), // jetpack_featured_media_url
  },
  (t) => [
    index('Post_authorId_idx').on(t.authorId),
    index('Post_createdAt_idx').on(sql`${t.createdAt} DESC`),
  ]
)

export const users = mysqlTable('User', {
  id: int('id').autoincrement().primaryKey(),
  slug: varchar('slug', { length: 191 }).notNull().unique('User_slug_key'),
  name: varchar('name', { length: 191 }).notNull(),
  description: text('description'),
})

export const categories = mysqlTable('Category', {
  id: int('id').autoincrement().primaryKey(),
  slug: varchar('slug', { length: 191 }).notNull().unique('Category_slug_key'),
  name: varchar('name', { length: 191 }).notNull(),
  description: text('description'),
})

export const tags = mysqlTable('Tag', {
  id: int('id').autoincrement().primaryKey(),
  slug: varchar('slug', { length: 191 }).notNull().unique('Tag_slug_key'),
  name: varchar('name', { length: 191 }).notNull(),
  description: text('description'),
})

export const categoriesOnPosts = mysqlTable(
  'CategoriesOnPosts',
  {
    postId: int('postId').notNull(),
    categoryId: int('categoryId').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.categoryId] }),
    index('CategoriesOnPosts_categoryId_idx').on(t.categoryId),
  ]
)

export const tagsOnPosts = mysqlTable(
  'TagsOnPosts',
  {
    postId: int('postId').notNull(),
    tagId: int('tagId').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.tagId] }),
    index('TagsOnPosts_tagId_idx').on(t.tagId),
  ]
)
