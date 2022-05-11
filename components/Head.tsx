import type { NextPage } from 'next'
import Head from 'next/head'

const origin = 'https://techcrunchjapan.com'
const title = 'TechCrunch Japan Archive'
const description =
  'TechCrunchはスタートアップ企業の紹介やインターネットの新しいプロダクトのレビュー、そして業界の重要なニュースを扱うテクノロジーメディアです。日本版TechCrunchは海外版記事の情報だけではなく、日本独自の視点からも情報を発信しています。'

const GlobalHead: NextPage = () => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <link
          rel="icon"
          href="/wp-content/uploads/2021/05/cropped-logo_tc-1.png"
        />
        <link rel="canonical" href={`${origin}/`} />
        <meta name="description" content={description} />
        <meta property="og:url" content={`${origin}/`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta
          property="og:image"
          content={`${origin}/wp-content/themes/techcrunch-jp-2015/assets/images/logo-large.png`}
        />
        <meta name="twitter:card" content="summary_large_image" />

        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/index.css" />
      </Head>
    </>
  )
}

export default GlobalHead
