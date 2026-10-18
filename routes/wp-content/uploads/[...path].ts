import { defineHandler } from 'void'

const uploadsOrigin = 'https://r2.techcrunchjapan.com'
const year = 60 * 60 * 24 * 365

// Uploaded media lives in R2 and is served under the original WordPress path.
export const GET = defineHandler(async (c) => {
  const url = new URL(c.req.url)
  const path = url.pathname.slice('/wp-content/uploads'.length)

  return fetch(`${uploadsOrigin}${path}${url.search}`, {
    cf: { cacheEverything: true, cacheTtl: year },
  })
})
