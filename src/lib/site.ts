export const SITE_ORIGIN = 'https://techcrunchjapan.com'
export const SITE_NAME = 'TechCrunch Japan Archive'
export const SITE_DESCRIPTION =
  'TechCrunchはスタートアップ企業の紹介やインターネットの新しいプロダクトのレビュー、そして業界の重要なニュースを扱うテクノロジーメディアです。日本版TechCrunchは海外版記事の情報だけではなく、日本独自の視点からも情報を発信しています。'
export const DEFAULT_OG_IMAGE =
  '/wp-content/themes/techcrunch-jp-2015/assets/images/logo-large.png'

/** Number of characters of `posts.excerpt` shown in listings and meta descriptions. */
export const EXCERPT_DISPLAY_LENGTH = 270

/** Resolves a site-relative path (or keeps an absolute URL) against the canonical origin. */
export function absoluteUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, SITE_ORIGIN).toString()
}
