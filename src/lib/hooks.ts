import { useSyncExternalStore, type KeyboardEvent, type MouseEvent } from 'react'

/** `true` once the window is scrolled further than `threshold` px. Re-renders only when that flips. */
export function useScrolledPast(threshold: number): boolean {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener('scroll', onChange, { passive: true })
      return () => window.removeEventListener('scroll', onChange)
    },
    () => window.scrollY > threshold,
    () => false,
  )
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Props that make a non-button element (styled by the legacy theme CSS) behave like a toggle button. */
export function toggleButtonProps(expanded: boolean, toggle: () => void) {
  return {
    role: 'button',
    tabIndex: 0,
    'aria-expanded': expanded,
    onClick: (event: MouseEvent) => {
      event.preventDefault()
      toggle()
    },
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        toggle()
      }
    },
  } as const
}
