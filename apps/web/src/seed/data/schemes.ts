import type { LayerRole } from '@/modules/technology/domain/wall-assembly'

/**
 * Article covers drawn as working-drawing schemes from the same data as the site: the wall
 * assembly and the foundation standards. Only dimensions in millimetres, no words, so one
 * image serves every language.
 */
const WIDTH = 1800
const HEIGHT = 1238
/** Length of wall the section shows and the stud width, mm. */
const SECTION_LENGTH = 1200
const STUD = 50

const INK = {
  paper: '#f3f3ee',
  grid: '#e3e4dd',
  line: '#2b312d',
  dimension: '#6f7671',
  timber: '#d8be94',
  timberDark: '#a8875a',
  insulation: '#e6cf9f',
  membrane: '#3f6f55',
  air: '#fafaf7',
  ground: '#cfc6b4',
  steel: '#59605c',
  accent: '#a9661a',
} as const

const FILL: Readonly<Record<LayerRole, string>> = {
  cladding: INK.timberDark,
  'air-gap': INK.air,
  membrane: INK.membrane,
  insulation: INK.insulation,
  batten: INK.air,
  lining: INK.timber,
}

const frame = (content: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">` +
  `<defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">` +
  `<path d="M60 0H0V60" fill="none" stroke="${INK.grid}" stroke-width="1"/></pattern>` +
  `<pattern id="wool" width="36" height="36" patternUnits="userSpaceOnUse">` +
  `<path d="M0 18 Q9 0 18 18 T36 18" fill="none" stroke="${INK.timberDark}" stroke-width="2" opacity="0.45"/></pattern>` +
  `<pattern id="soil" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
  `<path d="M0 0V28" stroke="${INK.dimension}" stroke-width="2" opacity="0.35"/></pattern></defs>` +
  `<rect width="${WIDTH}" height="${HEIGHT}" fill="${INK.paper}"/>` +
  `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)"/>${content}</svg>`

const text = (x: number, y: number, value: string, rotate = false) =>
  `<text x="${x}" y="${y}" font-family="Manrope, Arial, sans-serif" font-size="30" fill="${INK.dimension}" text-anchor="middle"` +
  `${rotate ? ` transform="rotate(-90 ${x} ${y})"` : ''}>${value}</text>`

/** A horizontal dimension line with ticks and its value above. */
function dimension(x0: number, x1: number, y: number, value: string) {
  const tick = (x: number) =>
    `<path d="M${x - 10} ${y + 10}L${x + 10} ${y - 10}M${x} ${y - 24}V${y + 24}" stroke="${INK.dimension}" stroke-width="2"/>`
  return (
    `<path d="M${x0} ${y}H${x1}" stroke="${INK.dimension}" stroke-width="2"/>` +
    tick(x0) +
    tick(x1) +
    text((x0 + x1) / 2, y - 16, value)
  )
}

/** A vertical dimension line with ticks and its value beside it. */
function verticalDimension(x: number, y0: number, y1: number, value: string) {
  const tick = (y: number) =>
    `<path d="M${x - 10} ${y + 10}L${x + 10} ${y - 10}M${x - 24} ${y}H${x + 24}" stroke="${INK.dimension}" stroke-width="2"/>`
  return (
    `<path d="M${x} ${y0}V${y1}" stroke="${INK.dimension}" stroke-width="2"/>` +
    tick(y0) +
    tick(y1) +
    text(x - 22, (y0 + y1) / 2, value, true)
  )
}

/** Plan section of the exterior wall, outside on the left, every layer to scale. */
export function wallSectionScheme(
  layers: ReadonlyArray<{ readonly role: LayerRole; readonly thickness: number }>,
): string {
  const total = layers.reduce((sum, layer) => sum + layer.thickness, 0)
  const scale = 1100 / total
  const left = (WIDTH - total * scale) / 2
  const top = 230
  const bottom = 930
  const thin = 6
  let x = left
  const parts: string[] = []
  const dimensions: string[] = []
  for (const layer of layers) {
    const width = Math.max(layer.thickness * scale, thin)
    const fill = FILL[layer.role]
    parts.push(
      `<rect x="${x}" y="${top}" width="${width}" height="${bottom - top}" fill="${fill}" stroke="${INK.line}" stroke-width="2"/>`,
    )
    if (layer.role === 'insulation') {
      parts.push(
        `<rect x="${x}" y="${top}" width="${width}" height="${bottom - top}" fill="url(#wool)"/>`,
        // Studs of the frame cut by the section: 50 mm every 600 mm of wall.
        ...[0.2, 0.7].map(
          (share) =>
            `<rect x="${x}" y="${top + (bottom - top) * share}" width="${width}" height="${(STUD * (bottom - top)) / SECTION_LENGTH}" fill="${INK.timber}" stroke="${INK.line}" stroke-width="2"/>`,
        ),
      )
    }
    if (layer.thickness >= 10)
      dimensions.push(dimension(x, x + width, bottom + 80, String(layer.thickness)))
    x += width
  }
  return frame(
    parts.join('') + dimensions.join('') + dimension(left, x, bottom + 190, String(total)),
  )
}

/** Elevation of a screw-pile foundation under a floor: piles, strapping beam and joists. */
export function pileFoundationScheme(standards: {
  readonly plinthHeight: number
  readonly pileSpacing: number
}): string {
  const scale = 0.16
  const groundY = 640
  const pileDepth = 2500
  const beam = 200
  const floorY = groundY - standards.plinthHeight * scale
  const span = standards.pileSpacing * scale
  const piles = [0, 1, 2, 3].map((index) => (WIDTH - 3 * span) / 2 + index * span)
  const parts: string[] = [
    `<rect x="0" y="${groundY}" width="${WIDTH}" height="${HEIGHT - groundY}" fill="${INK.ground}"/>`,
    `<rect x="0" y="${groundY}" width="${WIDTH}" height="${HEIGHT - groundY}" fill="url(#soil)"/>`,
    `<path d="M0 ${groundY}H${WIDTH}" stroke="${INK.line}" stroke-width="3"/>`,
  ]
  for (const x of piles) {
    const tip = groundY + pileDepth * scale
    parts.push(
      `<rect x="${x - 14}" y="${floorY + beam * scale}" width="28" height="${tip - floorY - beam * scale}" fill="${INK.steel}"/>`,
      `<path d="M${x - 14} ${tip}L${x} ${tip + 36}L${x + 14} ${tip}Z" fill="${INK.steel}"/>`,
      `<ellipse cx="${x}" cy="${tip - 40}" rx="70" ry="16" fill="none" stroke="${INK.steel}" stroke-width="8"/>`,
      `<rect x="${x - 40}" y="${floorY + beam * scale - 12}" width="80" height="12" fill="${INK.line}"/>`,
    )
  }
  const first = piles[0] ?? 0
  const last = piles[piles.length - 1] ?? 0
  parts.push(
    `<rect x="${first - 120}" y="${floorY}" width="${last - first + 240}" height="${beam * scale}" fill="${INK.timberDark}" stroke="${INK.line}" stroke-width="2"/>`,
    ...Array.from({ length: 13 }, (_, index) => {
      const x = first - 90 + index * ((last - first + 180) / 12)
      return `<rect x="${x - 10}" y="${floorY - 220 * scale}" width="20" height="${220 * scale}" fill="${INK.timber}" stroke="${INK.line}" stroke-width="2"/>`
    }),
    `<rect x="${first - 120}" y="${floorY - 220 * scale - 18}" width="${last - first + 240}" height="18" fill="${INK.timber}" stroke="${INK.line}" stroke-width="2"/>`,
  )
  return frame(
    parts.join('') +
      dimension(
        piles[1] ?? 0,
        piles[2] ?? 0,
        groundY + pileDepth * scale + 120,
        String(standards.pileSpacing),
      ) +
      verticalDimension(last + 220, floorY, groundY, String(standards.plinthHeight)) +
      verticalDimension(first - 200, groundY, groundY + pileDepth * scale, String(pileDepth)),
  )
}
