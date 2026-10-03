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

/*
 * The display face is set at one weight (500), so it ships as a static instance of the
 * variable font (fontTools varLib.instancer, see CREDITS.md): less than half the bytes. The
 * declared 400–600 range lets the same face serve every heading weight without faux bold.
 */
const literataLatin = localFont({
  src: '../../assets/fonts/web/literata-500-latin.woff2',
  weight: '400 600',
  // Latin headings swap in when it arrives; preloading it would compete with the first image.
  preload: false,
  variable: '--font-literata-latin',
  display: 'swap',
  adjustFontFallback: false,
  fallback: [],
})

// Cyrillic headings would reflow on swap: this small subset (12 KB) is preloaded.
const literataCyrillic = localFont({
  src: '../../assets/fonts/web/literata-500-cyrillic.woff2',
  weight: '400 600',
  variable: '--font-literata-cyrillic',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
})

export const fontVariables = [manropeLatin, manropeCyrillic, literataLatin, literataCyrillic]
  .map((font) => font.variable)
  .join(' ')
