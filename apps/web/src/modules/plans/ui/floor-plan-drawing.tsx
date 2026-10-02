import type { DimensionChain, FloorPlan, PlanDoor, PlanOpening } from '@kedrovnik/house'

import styles from './floor-plan.module.css'
import { drawingBounds, partitions, treads } from './plan-geometry'

/** Drawing constants in millimetres of the real house. */
const MARGINS = { near: 500, far: 1900 } as const
const DIMENSION_OFFSET = 650
const DIMENSION_STEP = 600
const TICK = 120
const MARKER_RADIUS = 330
/** Narrower segments keep their ticks but not a number that would overlap them. */
const MIN_LABELLED_SEGMENT = 700

const midpoint = (a: number, b: number) => (a + b) / 2

function Opening({ opening }: { readonly opening: PlanOpening }) {
  const { x0, y0, x1, y1 } = opening.rect
  const alongX = x1 - x0 > y1 - y0
  const line = (position: number) =>
    alongX
      ? { x1: x0, y1: position, x2: x1, y2: position }
      : { x1: position, y1: y0, x2: position, y2: y1 }
  const [from, to] = alongX ? [y0, y1] : [x0, x1]
  const glass = opening.panoramic ? styles.glassPanoramic : styles.glass
  if (opening.type === 'door') {
    return <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} className={styles.opening} />
  }
  return (
    <g>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} className={styles.opening} />
      <line {...line(from)} className={styles.frameLine} />
      <line {...line(midpoint(from, to))} className={glass} />
      <line {...line(to)} className={styles.frameLine} />
    </g>
  )
}

function Door({ door, thickness }: { readonly door: PlanDoor; readonly thickness: number }) {
  const half = door.width / 2
  const horizontal = door.orientation === 'horizontal'
  const gap = horizontal
    ? {
        x: door.x - half,
        y: door.y - thickness / 2 - 10,
        width: door.width,
        height: thickness + 20,
      }
    : {
        x: door.x - thickness / 2 - 10,
        y: door.y - half,
        width: thickness + 20,
        height: door.width,
      }
  const hinge = horizontal ? { x: door.x - half, y: door.y } : { x: door.x, y: door.y - half }
  const leafEnd = horizontal
    ? { x: hinge.x, y: hinge.y + door.width }
    : { x: hinge.x + door.width, y: hinge.y }
  const free = horizontal ? { x: door.x + half, y: door.y } : { x: door.x, y: door.y + half }
  return (
    <g>
      <rect {...gap} className={styles.opening} />
      <line x1={hinge.x} y1={hinge.y} x2={leafEnd.x} y2={leafEnd.y} className={styles.leaf} />
      <path
        d={`M ${free.x} ${free.y} A ${door.width} ${door.width} 0 0 1 ${leafEnd.x} ${leafEnd.y}`}
        className={styles.swing}
      />
    </g>
  )
}

function Dimension({ chain, plan }: { readonly chain: DimensionChain; readonly plan: FloorPlan }) {
  const bottom = chain.side === 'bottom'
  const base = bottom
    ? Math.max(plan.depth, plan.terrace?.y1 ?? 0)
    : Math.max(plan.width, plan.terrace?.x1 ?? 0)
  const line = base + DIMENSION_OFFSET + chain.tier * DIMENSION_STEP
  const point = (along: number, across: number) =>
    bottom ? { x: along, y: across } : { x: across, y: along }
  const first = chain.marks[0] ?? 0
  const last = chain.marks[chain.marks.length - 1] ?? 0
  const start = point(first, line)
  const end = point(last, line)
  return (
    <g
      className={`${styles.dimension} ${chain.tier === 0 && chain.marks.length > 2 ? styles.innerChain : ''}`}
    >
      <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
      {chain.marks.map((mark) => {
        const tick = point(mark, line)
        return (
          <g key={mark}>
            <line
              x1={tick.x - TICK}
              y1={tick.y + TICK}
              x2={tick.x + TICK}
              y2={tick.y - TICK}
              className={styles.tick}
            />
            <line
              {...(bottom
                ? { x1: mark, y1: line - DIMENSION_STEP / 2, x2: mark, y2: line + TICK }
                : { x1: line - DIMENSION_STEP / 2, y1: mark, x2: line + TICK, y2: mark })}
            />
          </g>
        )
      })}
      {chain.marks.slice(1).map((mark, index) => {
        const previous = chain.marks[index] ?? 0
        if (mark - previous < MIN_LABELLED_SEGMENT) return null
        const centre = point(midpoint(previous, mark), line - 90)
        return (
          <text
            key={mark}
            x={centre.x}
            y={centre.y}
            className={styles.dimensionText}
            transform={bottom ? undefined : `rotate(-90 ${centre.x} ${centre.y})`}
          >
            {Math.round(mark - previous)}
          </text>
        )
      })}
    </g>
  )
}

interface FloorPlanDrawingProps {
  readonly plan: FloorPlan
  readonly label: string
}

/** Working-drawing style plan: walls, partitions, joinery, numbered rooms and dimension chains. */
export function FloorPlanDrawing({ plan, label }: FloorPlanDrawingProps) {
  const bounds = drawingBounds(plan, MARGINS)
  const t = plan.wallThickness
  const outer = `M0 0H${plan.width}V${plan.depth}H0Z`
  const inner = `M${t} ${t}V${plan.depth - t}H${plan.width - t}V${t}Z`
  return (
    <svg
      className={styles.drawing}
      viewBox={`${bounds.x0} ${bounds.y0} ${bounds.x1 - bounds.x0} ${bounds.y1 - bounds.y0}`}
      role="img"
      aria-label={label}
    >
      <defs>
        <pattern id={`deck-${plan.level}`} width="140" height="140" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="140" y2="0" className={styles.deckLine} />
        </pattern>
      </defs>
      {plan.terrace === null ? null : (
        <g>
          <rect
            x={plan.terrace.x0}
            y={plan.terrace.y0}
            width={plan.terrace.x1 - plan.terrace.x0}
            height={plan.terrace.y1 - plan.terrace.y0}
            className={styles.terrace}
          />
          <rect
            x={plan.terrace.x0}
            y={plan.terrace.y0}
            width={plan.terrace.x1 - plan.terrace.x0}
            height={plan.terrace.y1 - plan.terrace.y0}
            fill={`url(#deck-${plan.level})`}
          />
        </g>
      )}
      {plan.rooms.map((room) => (
        <rect
          key={room.id}
          x={room.net.x0}
          y={room.net.y0}
          width={room.net.x1 - room.net.x0}
          height={room.net.y1 - room.net.y0}
          className={room.traits.wetZone ? styles.wetRoom : styles.room}
        />
      ))}
      {plan.rooms
        .filter((room) => room.traits.stair)
        .flatMap((room) =>
          treads(room.net).map((tread) => (
            <line key={`${room.id}-${tread.x1}-${tread.y1}`} {...tread} className={styles.tread} />
          )),
        )}
      {partitions(plan).map((segment) =>
        segment.orientation === 'horizontal' ? (
          <rect
            key={`h${segment.at}-${segment.from}-${segment.to}`}
            x={segment.from}
            y={segment.at - plan.partitionThickness / 2}
            width={segment.to - segment.from}
            height={plan.partitionThickness}
            className={styles.partition}
          />
        ) : (
          <rect
            key={`v${segment.at}-${segment.from}-${segment.to}`}
            x={segment.at - plan.partitionThickness / 2}
            y={segment.from}
            width={plan.partitionThickness}
            height={segment.to - segment.from}
            className={styles.partition}
          />
        ),
      )}
      <path d={`${outer}${inner}`} fillRule="evenodd" className={styles.wall} />
      {plan.openings.map((opening) => (
        <Opening key={opening.id} opening={opening} />
      ))}
      {plan.doors.map((door) => (
        <Door key={door.id} door={door} thickness={plan.partitionThickness} />
      ))}
      {plan.chimney === null ? null : (
        <circle
          cx={plan.chimney.x}
          cy={plan.chimney.y}
          r={plan.chimney.diameter / 2}
          className={styles.chimney}
        />
      )}
      {plan.rooms.map((room, index) => {
        const cx = midpoint(room.net.x0, room.net.x1)
        const cy = midpoint(room.net.y0, room.net.y1)
        return (
          <g key={`marker-${room.id}`} className={styles.marker}>
            <circle cx={cx} cy={cy} r={MARKER_RADIUS} />
            <text x={cx} y={cy} dy="0.35em">
              {index + 1}
            </text>
          </g>
        )
      })}
      {plan.dimensions.map((chain) => (
        <Dimension key={`${chain.side}-${chain.tier}`} chain={chain} plan={plan} />
      ))}
    </svg>
  )
}
