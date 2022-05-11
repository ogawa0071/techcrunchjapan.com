import type { NextPage } from 'next'
import Head from 'next/head'

export const origin = 'https://techcrunchjapan.com'
export const siteName = 'TechCrunch Japan Archive'
export const defaultDescription =
  'TechCrunchはスタートアップ企業の紹介やインターネットの新しいプロダクトのレビュー、そして業界の重要なニュースを扱うテクノロジーメディアです。日本版TechCrunchは海外版記事の情報だけではなく、日本独自の視点からも情報を発信しています。'

const GlobalHead: NextPage<{
  title?: string
  path?: string
  description?: string
  imagePath?: string
}> = ({ title, path, description, imagePath }) => {
  return (
    <>
      <Head>
        <title>{title ? `${title} | ${siteName}` : `${siteName}`}</title>
        <link
          rel="icon"
          href="/wp-content/uploads/2021/05/cropped-logo_tc-1.png"
        />
        <link rel="canonical" href={path ? `${origin}${path}` : `${origin}/`} />
        <meta name="description" content={description || defaultDescription} />
        <meta
          property="og:url"
          content={path ? `${origin}${path}` : `${origin}/`}
        />
        <meta
          property="og:title"
          content={title ? `${title} | ${siteName}` : `${siteName}`}
        />
        <meta
          property="og:description"
          content={description || defaultDescription}
        />
        <meta
          property="og:image"
          content={
            imagePath
              ? `${origin}${imagePath}`
              : `${origin}/wp-content/themes/techcrunch-jp-2015/assets/images/logo-large.png`
          }
        />
        <meta name="twitter:card" content="summary_large_image" />

        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/index.css" />
      </Head>
    </>
  )
}

export default GlobalHead
