'use client'

import { useSyncExternalStore } from 'react'

import { THEME_ATTRIBUTE, THEME_CHANGE_EVENT, type Theme } from './theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function currentTheme(): Theme {
  const explicit = document.documentElement.getAttribute(THEME_ATTRIBUTE)
  if (explicit === 'light' || explicit === 'dark') return explicit
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY)
  media.addEventListener('change', onChange)
  window.addEventListener(THEME_CHANGE_EVENT, onChange)
  return () => {
    media.removeEventListener('change', onChange)
    window.removeEventListener(THEME_CHANGE_EVENT, onChange)
  }
}

/**
 * The theme in effect: the visitor's explicit choice, else the system preference. Null before
 * hydration, when the server cannot know it.
 */
export function useTheme(): Theme | null {
  return useSyncExternalStore(subscribe, currentTheme, () => null)
}
