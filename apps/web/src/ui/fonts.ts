import localFont from 'next/font/local'

/*
 * Self-hosted variable fonts (SIL OFL 1.1, see CREDITS.md). Latin and Cyrillic subsets are
 * separate families stacked in the tokens: Latin first for digits and punctuation, Cyrillic
 * next, and a metric-adjusted fallback last so the swap does not shift the layout.
 */
const manropeLatin = localFont({
  src: '../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2',
  weight: '200 800',
  variable: '--font-manrope-latin',
  display: 'swap',
  adjustFontFallback: false,
  fallback: [],
})

const manropeCyrillic = localFont({
  src: '../../node_modules/@fontsource-variable/manrope/files/manrope-cyrillic-wght-normal.woff2',
  weight: '200 800',
  variable: '--font-manrope-cyrillic',
  display: 'swap',
  adjustFontFallback: 'Arial',
})

const literataLatin = localFont({
  src: '../../node_modules/@fontsource-variable/literata/files/literata-latin-wght-normal.woff2',
  weight: '200 900',
  variable: '--font-literata-latin',
  display: 'swap',
  adjustFontFallback: false,
  fallback: [],
})

const literataCyrillic = localFont({
  src: '../../node_modules/@fontsource-variable/literata/files/literata-cyrillic-wght-normal.woff2',
  weight: '200 900',
  variable: '--font-literata-cyrillic',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
})

export const fontVariables = [manropeLatin, manropeCyrillic, literataLatin, literataCyrillic]
  .map((font) => font.variable)
  .join(' ')
