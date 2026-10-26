/*
 * The brand in one place: the name and the mark. The site, the CMS, printed proposals, the app
 * icons and the product video all draw from here, so a change of identity is one edit.
 * Plain data and strings only: build scripts import this file straight into Node.
 */

/** The company name; the same word in every language of the site. */
export const BRAND_NAME = 'Cedarline'

/**
 * Brand colours for pictures drawn outside the stylesheet (app icons, video cards); the same
 * values as the light theme's tokens.
 */
export const BRAND_COLOURS = {
  pine: '#1e3b2f',
  paper: '#f3f3ee',
  ink: '#1f2421',
} as const

/** Side of the square grid the mark is drawn in. */
export const MARK_GRID = 32

export interface MarkStroke {
  readonly d: string
  readonly width: number
}

/**
 * A cedar on a ground line, in the line weight of the site's drawings: a trunk, a gable for the
 * crown (the roof of a frame house), two drooping tiers and the line it stands on.
 */
export const MARK_STROKES: readonly MarkStroke[] = [
  { d: 'M16 4.5v23', width: 1.6 },
  { d: 'M10.5 11 16 6.5l5.5 4.5', width: 1.6 },
  { d: 'M7 16.5c3.5-.8 6.5-2.6 9-5.2 2.5 2.6 5.5 4.4 9 5.2', width: 1.6 },
  { d: 'M4 22c4.6-1 8.6-3.3 12-6.5 3.4 3.2 7.4 5.5 12 6.5', width: 1.6 },
  { d: 'M4 27.5h24', width: 1.6 },
]

/** Stroke ends and corners of every line of the mark. */
export const MARK_LINE = { cap: 'round', join: 'round' } as const

export interface MarkPicture {
  /** Edge of the square picture, in pixels. */
  readonly size: number
  readonly colour: string
  /** A filled tile behind the mark, as app icons have; without it the mark is on transparency. */
  readonly tile?: { readonly colour: string; readonly radius: number }
  /** Share of the picture the mark's grid takes, centred; the rest is margin. */
  readonly scale?: number
  /** Line weight relative to the drawing: small icons need heavier lines to stay legible. */
  readonly weight?: number
}

/** Coordinates in the markup to a thousandth of a grid unit, without float noise. */
const unit = (value: number): number => Math.round(value * 1000) / 1000

/** The mark's lines as an SVG group in grid units, to place inside a larger drawing. */
export function markLines(colour: string, weight = 1): string {
  const lines = MARK_STROKES.map(
    (stroke) => `<path d="${stroke.d}" stroke-width="${unit(stroke.width * weight)}"/>`,
  ).join('')
  return `<g fill="none" stroke="${colour}" stroke-linecap="${MARK_LINE.cap}" stroke-linejoin="${MARK_LINE.join}">${lines}</g>`
}

/** The mark as a standalone SVG document, for icons and images drawn outside React. */
export function markSvg(picture: MarkPicture): string {
  const scale = picture.scale ?? 1
  const offset = unit((MARK_GRID * (1 - scale)) / 2)
  const tile =
    picture.tile === undefined
      ? ''
      : `<rect width="${MARK_GRID}" height="${MARK_GRID}" rx="${picture.tile.radius}" fill="${picture.tile.colour}"/>`
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${picture.size}" height="${picture.size}" viewBox="0 0 ${MARK_GRID} ${MARK_GRID}">` +
    tile +
    `<g transform="translate(${offset} ${offset}) scale(${scale})">` +
    markLines(picture.colour, picture.weight) +
    '</g></svg>'
  )
}
