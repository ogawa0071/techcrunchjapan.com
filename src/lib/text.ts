/** Cuts `text` to at most `maxLength` characters without splitting surrogate pairs. */
export function truncate(text: string, maxLength: number): string {
  const chars = Array.from(text)
  return chars.length <= maxLength ? text : chars.slice(0, maxLength).join('')
}
