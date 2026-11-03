/** `?page=N` of listing routes; page 1 is represented by its absence. */
export interface PageSearch {
  page?: number
}

export function validatePageSearch(
  search: Record<string, unknown>,
): PageSearch {
  const page = Number(search.page)
  return Number.isSafeInteger(page) && page > 1 ? { page } : {}
}
