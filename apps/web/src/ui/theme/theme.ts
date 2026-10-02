/** Colour themes. «system» follows the OS; an explicit choice is stored per browser. */
export const THEMES = ['light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

export const THEME_STORAGE_KEY = 'kedrovnik-theme'
export const THEME_ATTRIBUTE = 'data-theme'

/** Event the theme toggle dispatches so that canvases can repaint with the new tokens. */
export const THEME_CHANGE_EVENT = 'kedrovnik:theme-change'
