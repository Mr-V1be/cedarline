import type { LayerRole, ResolvedWall } from '../domain/wall-assembly'
import styles from './wall-section.module.css'

/** Drawing space, mm: the wall is drawn at true scale with room for numbers and the dimension. */
const MARGIN = 70
const HEIGHT = 420
const STUD = { width: 50, from: 190 } as const
const BATTEN = { width: 50, from: 60 } as const
const CALLOUT_Y = 34
const CALLOUT_R = 13
/** Centre-to-centre distance of callout circles, so thin neighbouring layers stay readable. */
const CALLOUT_STEP = 2 * CALLOUT_R + 5
const DIMENSION_Y = HEIGHT + 46

const FILL: Readonly<Record<LayerRole, string>> = {
  cladding: styles.cladding ?? '',
  'air-gap': styles.air ?? '',
  membrane: styles.membrane ?? '',
  insulation: styles.insulation ?? '',
  batten: styles.air ?? '',
  lining: styles.lining ?? '',
}

/**
 * Spreads callouts along a line: each keeps its layer's position unless it would collide with
 * its neighbour; a final pass pulls the row back inside the drawing.
 */
export function spreadCallouts(centres: readonly number[], min: number, max: number): number[] {
  const placed: number[] = []
  centres.forEach((centre, index) => {
    const previous = placed[index - 1]
    placed.push(
      previous === undefined ? Math.max(min, centre) : Math.max(centre, previous + CALLOUT_STEP),
    )
  })
  for (let index = placed.length - 1; index >= 0; index -= 1) {
    const next = placed[index + 1]
    const limit = next === undefined ? max : next - CALLOUT_STEP
    placed[index] = Math.min(placed[index] ?? limit, limit)
  }
  return placed
}

/** Horizontal section through the wall, outside on the left: layers, studs and battens to scale. */
export function WallSectionDrawing({
  wall,
  label,
  outside,
  inside,
}: {
  readonly wall: ResolvedWall
  readonly label: string
  readonly outside: string
  readonly inside: string
}) {
  const width = wall.totalThickness + 2 * MARGIN
  const layers = wall.layers.map((layer, index) => ({
    layer,
    index,
    x: MARGIN + wall.layers.slice(0, index).reduce((sum, previous) => sum + previous.thickness, 0),
  }))
  const top = CALLOUT_Y + CALLOUT_R + 24
  const callouts = spreadCallouts(
    layers.map(({ layer, x }) => x + layer.thickness / 2),
    CALLOUT_R,
    width - CALLOUT_R,
  )
  return (
    <svg
      className={styles.drawing}
      viewBox={`0 0 ${width} ${DIMENSION_Y + 30}`}
      role="img"
      aria-label={label}
    >
      <defs>
        <pattern id="wall-wool" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M0 12 q6 -10 12 0 t12 0" className={styles.woolLine} />
        </pattern>
        <pattern
          id="wall-grain"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="10" className={styles.grainLine} />
        </pattern>
      </defs>
      {layers.map(({ layer, x }) =>
        layer.role === 'membrane' ? (
          <line
            key={layer.key}
            x1={x + layer.thickness / 2}
            x2={x + layer.thickness / 2}
            y1={top}
            y2={HEIGHT}
            className={styles.membraneLine}
          />
        ) : (
          <g key={layer.key}>
            <rect
              x={x}
              y={top}
              width={layer.thickness}
              height={HEIGHT - top}
              className={FILL[layer.role]}
            />
            {layer.role === 'insulation' ? (
              <rect
                x={x}
                y={top}
                width={layer.thickness}
                height={HEIGHT - top}
                fill="url(#wall-wool)"
              />
            ) : null}
            {layer.role === 'cladding' || layer.role === 'lining' ? (
              <rect
                x={x}
                y={top}
                width={layer.thickness}
                height={HEIGHT - top}
                fill="url(#wall-grain)"
              />
            ) : null}
            {layer.role === 'insulation' ? (
              <rect
                x={x}
                y={top + STUD.from}
                width={layer.thickness}
                height={STUD.width}
                className={styles.timber}
              />
            ) : null}
            {layer.role === 'air-gap' || layer.role === 'batten' ? (
              <rect
                x={x}
                y={top + BATTEN.from}
                width={layer.thickness}
                height={BATTEN.width}
                className={styles.timber}
              />
            ) : null}
          </g>
        ),
      )}
      {layers.map(({ layer, index, x }) => {
        const centre = x + layer.thickness / 2
        const at = callouts[index] ?? centre
        return (
          <g key={`callout-${layer.key}`} className={styles.callout}>
            <line x1={at} x2={centre} y1={CALLOUT_Y + CALLOUT_R} y2={top + 10} />
            <circle cx={centre} cy={top + 10} r={2.2} />
            <circle cx={at} cy={CALLOUT_Y} r={CALLOUT_R} />
            <text x={at} y={CALLOUT_Y} dy="0.35em">
              {index + 1}
            </text>
          </g>
        )
      })}
      <g className={styles.dimension}>
        <line x1={MARGIN} x2={MARGIN + wall.totalThickness} y1={DIMENSION_Y} y2={DIMENSION_Y} />
        {[MARGIN, MARGIN + wall.totalThickness].map((x) => (
          <g key={x}>
            <line x1={x} x2={x} y1={HEIGHT + 8} y2={DIMENSION_Y + 8} />
            <line x1={x - 6} x2={x + 6} y1={DIMENSION_Y + 6} y2={DIMENSION_Y - 6} />
          </g>
        ))}
        <text x={MARGIN + wall.totalThickness / 2} y={DIMENSION_Y - 10}>
          {wall.totalThickness}
        </text>
      </g>
      <text x={MARGIN - 12} y={HEIGHT - 8} className={styles.sideLabel} textAnchor="end">
        {outside}
      </text>
      <text x={MARGIN + wall.totalThickness + 12} y={HEIGHT - 8} className={styles.sideLabel}>
        {inside}
      </text>
    </svg>
  )
}
