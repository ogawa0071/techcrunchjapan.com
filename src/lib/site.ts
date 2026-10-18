import type { HeadDescriptor } from 'void'

export const origin = 'https://techcrunchjapan.com'
export const siteName = 'TechCrunch Japan Archive'
export const defaultDescription =
  'TechCrunchはスタートアップ企業の紹介やインターネットの新しいプロダクトのレビュー、そして業界の重要なニュースを扱うテクノロジーメディアです。日本版TechCrunchは海外版記事の情報だけではなく、日本独自の視点からも情報を発信しています。'
const defaultImagePath =
  '/wp-content/themes/techcrunch-jp-2015/assets/images/logo-large.png'

export function siteHead({
  title,
  path = '/',
  description = defaultDescription,
  imagePath = defaultImagePath,
}: {
  title?: string
  path?: string
  description?: string
  imagePath?: string | null
} = {}): HeadDescriptor {
  const fullTitle = title ? `${title} | ${siteName}` : siteName

  return {
    title: fullTitle,
    meta: [
      { name: 'description', content: description },
      { property: 'og:url', content: `${origin}${path}` },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      {
        property: 'og:image',
        content: `${origin}${imagePath ?? defaultImagePath}`,
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'robots', content: 'max-image-preview:large' },
    ],
    link: [{ rel: 'canonical', href: `${origin}${path}` }],
  }
}
