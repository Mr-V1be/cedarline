'use client'

import { useSyncExternalStore } from 'react'

let supported: boolean | undefined

/**
 * Whether the browser can draw the scene. Probed once per page with a throw-away context that
 * is released at once: browsers cap live WebGL contexts, and probing on every render would
 * evict the scene's own context.
 */
function probe(): boolean {
  if (supported !== undefined) return supported
  try {
    const context = document.createElement('canvas').getContext('webgl2')
    supported = context !== null
    context?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    supported = false
  }
  return supported
}

const subscribeNever = () => () => undefined

export const useWebglSupport = (): boolean =>
  useSyncExternalStore(subscribeNever, probe, () => true)
