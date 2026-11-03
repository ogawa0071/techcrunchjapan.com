import { ClientOnly, useMatches } from '@tanstack/react-router'
import { useEffect } from 'react'

const ADSENSE_CLIENT = 'ca-pub-8137402229295875'
const ADSENSE_SCRIPT = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

/**
 * Loads adsbygoogle.js once, on the first page that shows an ad (as the old next/script
 * in the sidebar did), so it never runs on 404 or error pages.
 */
function loadAdSense() {
  if (document.querySelector(`script[src="${ADSENSE_SCRIPT}"]`)) return
  const script = document.createElement('script')
  script.src = ADSENSE_SCRIPT
  script.async = true
  script.crossOrigin = 'anonymous'
  // appendChild: the Workers runtime types redefine Element.append (HTMLRewriter).
  document.head.appendChild(script)
}

function AdUnit({ slot }: { slot: string }) {
  useEffect(() => {
    loadAdSense()
    try {
      ;(window.adsbygoogle ??= []).push({})
    } catch {
      // Ad blockers, or the slot was already filled (React StrictMode double effects in dev).
    }
  }, [])

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}

/**
 * A responsive AdSense unit. Rendered on the client only (adsbygoogle.js mutates the
 * <ins>, which React would report as a hydration mismatch), and keyed by the current leaf
 * match (route + params + loader deps such as ?page=N), which is committed together with
 * the page: every page view requests exactly one ad, while hash or tracking-parameter
 * changes do not.
 */
export function AdSlot({ slot }: { slot: string }) {
  const matchId = useMatches({
    select: (matches) => matches[matches.length - 1]?.id ?? '',
  })
  return (
    <ClientOnly fallback={null}>
      <AdUnit key={matchId} slot={slot} />
    </ClientOnly>
  )
}
