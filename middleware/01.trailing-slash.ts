import { defineMiddleware } from 'void'

// The archive keeps the WordPress URLs, which end with a slash
// (`/2022/03/31/slug/`). Void routes match paths without it, so serve slashed
// paths through a rewrite and redirect the others to their slashed form.
export default defineMiddleware(async (c, next) => {
  const path = c.req.path
  if (c.isRewritten() || path === '/') return next()

  if (path.endsWith('/')) return c.rewrite(path.slice(0, -1))

  const isFile = path.slice(path.lastIndexOf('/') + 1).includes('.')
  const isPage =
    !isFile &&
    !path.startsWith('/api/') &&
    !path.startsWith('/__void/') &&
    (c.req.method === 'GET' || c.req.method === 'HEAD')
  if (!isPage) return next()

  const url = new URL(c.req.url)
  url.pathname = `${path}/`
  return c.redirect(url.toString(), 308)
})
