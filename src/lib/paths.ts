import { datePath, jstDateParts } from './date'
import { slugToPathSegment } from './slug'

// Canonical URLs keep the stored (WordPress, lowercase percent-encoded) slugs verbatim,
// so they match the sitemaps and the links indexed from the original site.

export function postPath(post: { slug: string; createdAt: Date }): string {
  return `${datePath(post.createdAt)}/${slugToPathSegment(post.slug)}/`
}

export const categoryPath = (slug: string) =>
  `/category/${slugToPathSegment(slug)}/`
export const tagPath = (slug: string) => `/tag/${slugToPathSegment(slug)}/`
export const authorPath = (slug: string) =>
  `/author/${slugToPathSegment(slug)}/`
export const searchPath = (query: string) =>
  `/search/${encodeURIComponent(query)}/`

/** Appends `?page=N` for N > 1. */
export function withPage(path: string, page: number): string {
  return page > 1 ? `${path}?page=${page}` : path
}

// Typed <Link> targets. The router percent-encodes params itself, so it gets the
// decoded form of the canonical path segment (never the raw stored slug, which would
// be double-encoded as %25xx).

const routerParam = (slug: string) =>
  decodeURIComponent(slugToPathSegment(slug))

export function postLink(post: { slug: string; createdAt: Date }) {
  return {
    to: '/$year/$month/$day/$slug/',
    params: { ...jstDateParts(post.createdAt), slug: routerParam(post.slug) },
  } as const
}

export const categoryLink = (slug: string) =>
  ({ to: '/category/$slug/', params: { slug: routerParam(slug) } }) as const

export const authorLink = (slug: string) =>
  ({ to: '/author/$slug/', params: { slug: routerParam(slug) } }) as const

export const PLACEHOLDER_THUMBNAIL =
  '/wp-content/themes/techcrunch-jp-2015/assets/images/210x210.png'

/** Jetpack-style resize parameters, as used by the original theme. */
export function thumbnailUrl(
  url: string | null,
  width: number,
  height: number,
): string {
  return url ? `${url}?w=${width}&h=${height}&crop=1` : PLACEHOLDER_THUMBNAIL
}
