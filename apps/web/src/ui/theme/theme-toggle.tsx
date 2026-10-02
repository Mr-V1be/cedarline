'use client'

import { MoonIcon, SunIcon } from '@phosphor-icons/react/ssr'
import { useSyncExternalStore } from 'react'

import { Icon } from '../components/icon/icon'
import styles from './theme-toggle.module.css'
import { THEME_ATTRIBUTE, THEME_CHANGE_EVENT, THEME_STORAGE_KEY, type Theme } from './theme'

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

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage can be blocked (private mode); the choice then lasts for this page only.
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
}

/** Light/dark switch. Before hydration the server cannot know the theme, so it renders unchecked. */
export function ThemeToggle({ label }: { readonly label: string }) {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => null)
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={label}
      title={label}
      className={styles.toggle}
      onClick={() => {
        applyTheme(dark ? 'light' : 'dark')
      }}
    >
      <Icon glyph={dark ? SunIcon : MoonIcon} size="m" />
    </button>
  )
}
