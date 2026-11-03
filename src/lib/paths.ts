import { datePath } from './date'
import { slugToPathSegment } from './slug'

// Internal URLs are always built from the stored (WordPress-encoded) slugs, verbatim,
// so they match the canonical URLs, sitemaps and links indexed from the old site.

export function postPath(post: { slug: string; createdAt: Date }): string {
  return `${datePath(post.createdAt)}/${slugToPathSegment(post.slug)}/`
}

export const categoryPath = (slug: string) => `/category/${slugToPathSegment(slug)}/`
export const tagPath = (slug: string) => `/tag/${slugToPathSegment(slug)}/`
export const authorPath = (slug: string) => `/author/${slugToPathSegment(slug)}/`
export const searchPath = (query: string) => `/search/${encodeURIComponent(query)}/`

/** Appends `?page=N` for N > 1. */
export function withPage(path: string, page: number): string {
  return page > 1 ? `${path}?page=${page}` : path
}

export const PLACEHOLDER_THUMBNAIL = '/wp-content/themes/techcrunch-jp-2015/assets/images/210x210.png'

/** Jetpack-style resize parameters, as used by the original theme. */
export function thumbnailUrl(url: string | null, width: number, height: number): string {
  return url ? `${url}?w=${width}&h=${height}&crop=1` : PLACEHOLDER_THUMBNAIL
}
