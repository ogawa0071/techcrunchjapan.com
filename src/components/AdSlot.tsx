import { useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'

export const ADSENSE_CLIENT = 'ca-pub-8137402229295875'
export const ADSENSE_SCRIPT = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

function AdUnit({ slot }: { slot: string }) {
  useEffect(() => {
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

/** A responsive AdSense unit; a fresh unit is requested for every page (client-side navigations included). */
export function AdSlot({ slot }: { slot: string }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return <AdUnit key={pathname} slot={slot} />
}
