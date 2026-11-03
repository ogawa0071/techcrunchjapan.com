import {
  createFileRoute,
  redirect,
  type AnyRouter,
} from '@tanstack/react-router'

import { getLegacyPostPath } from '../server/functions'

/**
 * Dateless permalinks of the old WordPress site: `/archives/<slug>/` and
 * `/archives/<post id>/`. Dated ones (`/archives/YYYY/MM/DD/<slug>/`) are redirected by
 * the server entry before reaching the router.
 */
export const Route = createFileRoute('/archives/$key')({
  loader: async ({ params, location }) => {
    const path = await getLegacyPostPath({ data: { key: params.key } })
    throw redirect<AnyRouter>({
      href: path + location.searchStr,
      statusCode: 301,
    })
  },
})
