import type { Metadata } from 'next'
import { defaultDescription, origin, siteName } from 'components/Head'

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  icons: {
    icon: '/wp-content/uploads/2021/05/cropped-logo_tc-1.png',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    url: '/',
    title: siteName,
    description: defaultDescription,
    images: [
      '/wp-content/themes/techcrunch-jp-2015/assets/images/logo-large.png',
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    'max-image-preview': 'large',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/index.css" />
      </head>
      <body>{children}</body>
    </html>
  )
}
