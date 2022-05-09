import { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  url.hostname = 'storage.googleapis.com'
  url.port = '443'
  url.protocol = 'https:'
  url.pathname = `/techcrunchjapan-com${req.nextUrl.pathname}`

  return await fetch(url.toString())
}
