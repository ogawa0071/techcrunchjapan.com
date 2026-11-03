import { sql } from 'drizzle-orm'
import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

// IDs are the original WordPress IDs, so they are inserted explicitly by the
// data migration. "BY DEFAULT" identity still allows that while keeping
// auto-numbering available for rows created later.

export const authors = pgTable('authors', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
})

export const categories = pgTable('categories', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
})

export const tags = pgTable('tags', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
})

export const posts = pgTable(
  'posts',
  {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    /**
     * WordPress `post_name`: lowercase, with non-ASCII characters
     * percent-encoded (e.g. `%e3%81%82`). Slugs longer than 191 characters
     * were truncated by the previous MySQL schema (VARCHAR(191)).
     */
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    /** Rendered HTML (`content.rendered`). */
    content: text('content').notNull(),
    /** Plain-text lead of `content`, precomputed by the data migration. */
    excerpt: text('excerpt').notNull().default(''),
    /** `jetpack_featured_media_url` */
    featuredMediaUrl: text('featured_media_url'),
    authorId: integer('author_id')
      .notNull()
      .references(() => authors.id),
    /** `date_gmt` */
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** `modified_gmt` */
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    // Listings are ordered by (created_at DESC, id DESC); both are read backwards.
    index('posts_created_at_id_idx').on(t.createdAt, t.id),
    index('posts_author_id_created_at_id_idx').on(
      t.authorId,
      t.createdAt,
      t.id,
    ),
    // Title search (`ILIKE '%…%'`) for terms of 3+ characters; needs the pg_trgm extension,
    // created by the first migration.
    index('posts_title_trgm_idx').using('gin', sql`${t.title} gin_trgm_ops`),
  ],
)

export const postCategories = pgTable(
  'post_categories',
  {
    postId: integer('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.categoryId] }),
    index('post_categories_category_id_idx').on(t.categoryId),
  ],
)

export const postTags = pgTable(
  'post_tags',
  {
    postId: integer('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.tagId] }),
    index('post_tags_tag_id_idx').on(t.tagId),
  ],
)
