import path from 'node:path'

import { Font } from '@react-pdf/renderer'

/** Static instances of the site's fonts (OFL), kept with the server, not the public site. */
const FONT_DIRECTORY = path.resolve(process.cwd(), 'assets/fonts')

export const PDF_FONTS = { ui: 'Manrope', display: 'Literata' } as const

let registered = false

/** Registers the fonts once per process; the PDF renderer embeds the glyphs it uses. */
export function registerPdfFonts(): void {
  if (registered) return
  Font.register({
    family: PDF_FONTS.ui,
    fonts: [
      { src: path.join(FONT_DIRECTORY, 'Manrope-Regular.ttf'), fontWeight: 400 },
      { src: path.join(FONT_DIRECTORY, 'Manrope-SemiBold.ttf'), fontWeight: 600 },
    ],
  })
  Font.register({
    family: PDF_FONTS.display,
    src: path.join(FONT_DIRECTORY, 'Literata-Medium.ttf'),
    fontWeight: 500,
  })
  // Words are never hyphenated: Russian estimate lines read better whole.
  Font.registerHyphenationCallback((word) => [word])
  registered = true
}
