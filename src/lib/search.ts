/**
 * Text in the form compared by the title search: Unicode NFKC (full-width letters and
 * digits become half-width, half-width katakana full-width, ...) and lower case. Titles
 * are stored in this form (`posts.search_title`) by the data migration, so that "ＡＩ",
 * "Ai" and "ai" find the same articles; SQLite itself only folds ASCII letters.
 */
export function toSearchText(text: string): string {
  return text.normalize('NFKC').toLowerCase()
}

/** At most this many words of a query are matched (all of them must appear). */
export const MAX_SEARCH_WORDS = 5

/** The words of a search query, in search form. */
export function searchWords(query: string): string[] {
  return toSearchText(query)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_SEARCH_WORDS)
}
