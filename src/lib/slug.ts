/**
 * WordPress slugs are lowercase ASCII where every non-ASCII character is stored
 * percent-encoded (`%e3%81%82`). Some slugs were cut at 191 characters by the old
 * MySQL schema, which can leave a dangling, undecodable sequence at the end
 * (`...%e3%81` or `...%e`).
 */

/** Non-decodable tail of a slug: `%` characters there must be escaped to appear in a URL. */
function splitDecodable(slug: string): [head: string, tail: string] {
  for (let end = slug.length; end >= 0; end--) {
    const head = slug.slice(0, end)
    try {
      decodeURIComponent(head)
      return [head, slug.slice(end)]
    } catch {
      // keep shrinking until the prefix decodes
    }
  }
  return ['', slug]
}

/**
 * The URL path segment for a stored slug. Valid slugs are used verbatim; a broken tail
 * gets its `%` escaped as `%25` so that the URL is valid and the router can decode it.
 */
export function slugToPathSegment(slug: string): string {
  const [head, tail] = splitDecodable(slug)
  return head + tail.replaceAll('%', '%25')
}

/**
 * Converts a path parameter (already decoded by the router, or still encoded) back
 * to the stored WordPress form. Returns `undefined` for values that cannot be a slug.
 */
export function toStoredSlug(param: string): string | undefined {
  let slug = ''
  for (const char of param) {
    if (char.charCodeAt(0) < 0x80) {
      slug += char.toLowerCase()
    } else {
      try {
        slug += encodeURIComponent(char).toLowerCase()
      } catch {
        return undefined // lone surrogate
      }
    }
  }
  return slug
}
