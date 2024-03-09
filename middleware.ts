import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/wp-content/uploads')) {
    const url = req.nextUrl
    url.hostname = 'r2.techcrunchjapan.com'
    url.port = '443'
    url.protocol = 'https:'
    url.pathname = `${req.nextUrl.pathname.split('/wp-content/uploads')[1]}`

    return await fetch(url.toString())
  }

  if (req.nextUrl.pathname.startsWith('/archives')) {
    const url = req.nextUrl
    url.pathname = req.nextUrl.pathname.split('/archives')[1]
    return NextResponse.redirect(url)
  }
}
