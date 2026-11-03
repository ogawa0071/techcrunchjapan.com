/** `?page=N` of listing routes; page 1 is represented by its absence. */
export interface PageSearch {
  page?: number
}

/**
 * Always returns the `page` key: the router merges validated over raw search params, so
 * an invalid raw value (`?page=0`, `?page=2&page=3`) must be overwritten, exactly like the
 * server entry's normalized render URL (lib/urls.ts canonicalSearch) - otherwise the client
 * computes different loader deps than the server and re-renders after hydration.
 */
export function validatePageSearch(
  search: Record<string, unknown>,
): PageSearch {
  const page = Number(search.page)
  return { page: Number.isSafeInteger(page) && page > 1 ? page : undefined }
}
