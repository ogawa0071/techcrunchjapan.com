/**
 * WordPress slugs are lowercase ASCII where every non-ASCII character is stored
 * percent-encoded (`%e3%81%82`). Some slugs were cut at 191 characters by the old
 * MySQL schema, which can leave a dangling, undecodable sequence at the end
 * (`...%e3%81` or `...%e`).
 */

/**
 * Returns the decoded string, or `undefined` when it is malformed.
 *
 * The result must be used by callers: Vite 8 (Rolldown) treats decodeURI* as pure and
 * drops calls whose result is unused, even inside try/catch.
 */
export function tryDecodeURIComponent(value: string): string | undefined {
  try {
    return decodeURIComponent(value)
  } catch {
    return undefined
  }
}

/** Splits a slug into its longest decodable prefix and the undecodable rest. */
function splitDecodable(slug: string): [head: string, tail: string] {
  for (let end = slug.length; end > 0; end--) {
    if (tryDecodeURIComponent(slug.slice(0, end)) !== undefined) {
      return [slug.slice(0, end), slug.slice(end)]
    }
  }
  return ['', slug]
}

/**
 * The URL path segment for a stored slug. Valid slugs are used verbatim; a broken tail
 * gets its `%` escaped as `%25`, so that the URL is valid and the router can decode it.
 */
export function slugToPathSegment(slug: string): string {
  const [head, tail] = splitDecodable(slug)
  return head + tail.replaceAll('%', '%25')
}

/**
 * Converts a route param (decoded by the router) back to the stored WordPress form:
 * ASCII is lowercased and kept, anything else is percent-encoded with lowercase hex.
 * Returns `undefined` for values that cannot be a slug.
 */
export function toStoredSlug(param: string): string | undefined {
  let slug = ''
  for (const char of param) {
    if (char.charCodeAt(0) < 0x80) {
      slug += char.toLowerCase()
      continue
    }
    try {
      slug += encodeURIComponent(char).toLowerCase()
    } catch {
      return undefined // lone surrogate
    }
  }
  return slug
}
