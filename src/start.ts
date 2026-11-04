import { isNotFound, isRedirect } from '@tanstack/react-router'
import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from '@tanstack/react-start'
import {
  getResponseStatus,
  setResponseStatus,
} from '@tanstack/react-start/server'

/**
 * Unexpected server-function errors are serialized into an HTTP 200 reply by default,
 * which the edge cache would keep for 30 days. Give them a 500 status instead, unless the
 * code that threw set an error status itself (503 when D1 fails, 429 over a rate limit).
 * notFound() / redirect() are regular results and keep their 200.
 */
const errorStatus = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    try {
      return await next()
    } catch (error) {
      if (
        !isNotFound(error) &&
        !isRedirect(error) &&
        getResponseStatus() < 400
      ) {
        setResponseStatus(500)
      }
      throw error
    }
  },
)

export const startInstance = createStart(() => ({
  // Defining src/start.ts replaces Start's default CSRF protection for server functions,
  // so it is added back explicitly.
  requestMiddleware: [
    createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === 'serverFn' }),
  ],
  functionMiddleware: [errorStatus],
}))
