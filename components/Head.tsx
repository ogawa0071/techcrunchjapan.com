import type { NextPage } from 'next'
import Head from 'next/head'

const GlobalHead: NextPage = () => {
  return (
    <>
      <Head>
        <title>16年間のご愛読ありがとうございました。 | TechCrunch Japan</title>
        <meta
          name="viewport"
          content="initial-scale=1.0,width=device-width,user-scalable=no,minimum-scale=1.0,maximum-scale=1.0"
        />
        <link
          rel="icon"
          href="/wp-content/uploads/2021/05/cropped-logo_tc-1.png"
        />

        {/* META */}

        <link rel="stylesheet" href="/index.css" />
      </Head>
    </>
  )
}

export default GlobalHead
