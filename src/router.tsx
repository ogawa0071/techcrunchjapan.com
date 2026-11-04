import { createRouter } from '@tanstack/react-router'

import { ErrorPage } from './components/ErrorPage'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  return createRouter({
    routeTree,
    // Canonical URLs end with "/" (as on the original WordPress site). The server entry
    // answers slash-less URLs with a single 301, so generated links never cost a hop.
    trailingSlash: 'always',
    // Unmatched URLs render the root 404 without running loaders of partial matches.
    notFoundMode: 'root',
    scrollRestoration: true,
    defaultPreload: 'intent',
    // The archive never changes: keep loader data for client-side back/forward navigation.
    defaultStaleTime: 5 * 60 * 1000,
    // Errors of child routes render with the same component on the server and the client.
    defaultErrorComponent: ErrorPage,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }

  interface StaticDataRouteOption {
    /** Extra class for <body> (the legacy theme styles article pages via `body.single-post`). */
    bodyClass?: string
  }
}
