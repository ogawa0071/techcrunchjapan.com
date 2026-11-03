import {
  absoluteUrl,
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
} from './site'

export interface SeoOptions {
  /** Page title without the site name. */
  title?: string
  description?: string
  /** Canonical site-relative path, e.g. `/2022/03/31/final/`. */
  path: string
  /** Site-relative path or absolute URL of the share image. */
  image?: string | null
  type?: 'website' | 'article'
  /** Keep the page out of search results (e.g. search result listings). */
  noindex?: boolean
}

/** `head()` contents shared by every page: title, description, canonical URL and OGP. */
export function seo({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex,
}: SeoOptions) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  const url = absoluteUrl(path)
  const text = description || SITE_DESCRIPTION

  return {
    meta: [
      { title: fullTitle },
      { name: 'description', content: text },
      { property: 'og:type', content: type },
      { property: 'og:url', content: url },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: text },
      { property: 'og:image', content: absoluteUrl(image || DEFAULT_OG_IMAGE) },
      ...(noindex ? [{ name: 'robots', content: 'noindex, follow' }] : []),
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}

/** Serializes JSON-LD safely for an inline <script> element. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
