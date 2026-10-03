'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

/** Signs that the visitor is engaging with the page. */
const INTENT_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const
/** Without such a sign a deferred start happens once the page has settled for this long. */
const SETTLE_MS = 3000

const subscribeNever = () => () => undefined

/**
 * Whether a heavy part of the page (a 3D scene, a map) may start now. Where `deferred` says so
 * — phones and weak devices — the page first stays light and responsive, and the part starts
 * on the visitor's first interaction or when the page has settled. Elsewhere it starts at once.
 */
export function useIntentStart(deferred: () => boolean): boolean {
  const waiting = useSyncExternalStore(subscribeNever, deferred, () => true)
  const [triggered, setTriggered] = useState(false)

  useEffect(() => {
    if (!waiting || triggered) return
    const trigger = () => {
      setTriggered(true)
    }
    for (const event of INTENT_EVENTS) {
      window.addEventListener(event, trigger, { once: true, passive: true })
    }
    let idle: number | null = null
    const timer = window.setTimeout(() => {
      idle = window.requestIdleCallback(trigger, { timeout: SETTLE_MS })
    }, SETTLE_MS)
    return () => {
      for (const event of INTENT_EVENTS) window.removeEventListener(event, trigger)
      window.clearTimeout(timer)
      if (idle !== null) window.cancelIdleCallback(idle)
    }
  }, [waiting, triggered])

  return !waiting || triggered
}
