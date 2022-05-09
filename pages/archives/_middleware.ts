import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  url.pathname = req.nextUrl.pathname.split('/archives')[1]
  return NextResponse.redirect(url)
}
