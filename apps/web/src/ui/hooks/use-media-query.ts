'use client'

import { useSyncExternalStore } from 'react'

/**
 * Whether a media query matches, kept in sync with the viewport. On the server and before
 * hydration it reports `fallback`, so markup does not depend on a guess about the screen.
 */
export function useMediaQuery(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => {
        media.removeEventListener('change', onChange)
      }
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  )
}
