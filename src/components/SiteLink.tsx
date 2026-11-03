import { Link } from '@tanstack/react-router'
import type { AnchorHTMLAttributes } from 'react'

type SiteLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  /** Canonical site-relative URL built by `lib/paths` (already percent-encoded). */
  href: string
}

/**
 * Client-side link to an internal URL whose path is already encoded exactly as it
 * should appear (WordPress slugs are stored percent-encoded).
 */
export function SiteLink({ href, ...props }: SiteLinkProps) {
  return <Link to={href} {...props} />
}
