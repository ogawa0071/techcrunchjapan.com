import { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  url.hostname = 'r2.techcrunchjapan.com'
  url.port = '443'
  url.protocol = 'https:'
  url.pathname = `${req.nextUrl.pathname.split('/wp-content/uploads')[1]}`

  return await fetch(url.toString())
}
