import { planPointOnWall, wallPlacement } from '../frame/placement'
import type { HouseFrame } from '../frame/types'
import { toMetres, type Vec3 } from '../units'
import { terraceSteps } from './details'
import type { WorldMapping } from './space'

/** Where a path to the house begins and which way it leads away from the house. */
export interface Approach {
  readonly start: Vec3
  readonly direction: Vec3
  /** Path width in metres. */
  readonly width: number
}

const PATH_WIDTH = 1200

/**
 * The main way in: the entrance door, preferring the front facade. When a terrace covers the
 * door, the path starts at the foot of the terrace steps instead.
 */
export function approachOf(frame: HouseFrame, mapping: WorldMapping): Approach | null {
  const doors = frame.walls.flatMap((wall) =>
    wall.openings.filter((item) => item.opening.type === 'door').map((item) => ({ wall, item })),
  )
  const entrance = doors.find(({ wall }) => wall.side === 'front') ?? doors[0]
  if (entrance === undefined) return null
  const { wall, item } = entrance
  const doorCentre = (item.u0 + item.u1) / 2
  const terrace = frame.terrace
  const onTerrace =
    terrace !== null &&
    terrace.side === wall.side &&
    doorCentre >= terrace.offset &&
    doorCentre <= terrace.offset + terrace.length

  const [x, y] = onTerrace
    ? planPointOnWall(
        wall,
        terrace.offset + terrace.length / 2,
        terrace.depth + terraceSteps(terrace.deckTop).run,
      )
    : planPointOnWall(wall, doorCentre, 0)
  return {
    start: mapping.point(x, y, 0),
    direction: mapping.direction(wall.outward),
    width: toMetres(PATH_WIDTH),
  }
}

/** Axis-aligned rectangle on the ground, world metres: [x, z] corners. */
export interface GroundRect {
  readonly min: readonly [number, number]
  readonly max: readonly [number, number]
}

/** Where the house meets the ground, for site dressing (blind area, lawn, paths). */
export interface SiteAnchors {
  /** Outer faces of the walls. */
  readonly footprint: GroundRect
  /** Ground under the terrace deck and its steps; no blind area is laid there. */
  readonly terrace: GroundRect | null
}

function rectOf(points: ReadonlyArray<readonly [number, number, number]>): GroundRect {
  const xs = points.map(([x]) => x)
  const zs = points.map(([, , z]) => z)
  return { min: [Math.min(...xs), Math.min(...zs)], max: [Math.max(...xs), Math.max(...zs)] }
}

export function siteAnchorsOf(frame: HouseFrame, mapping: WorldMapping): SiteAnchors {
  const { width, depth } = frame.spec
  const footprint = rectOf([mapping.point(0, 0, 0), mapping.point(width, depth, 0)])
  const { terrace } = frame
  if (terrace === null) return { footprint, terrace: null }
  const wall = wallPlacement(frame.spec, terrace.side)
  const reach = terrace.depth + terraceSteps(terrace.deckTop).run
  const corners = [
    planPointOnWall(wall, terrace.offset, 0),
    planPointOnWall(wall, terrace.offset + terrace.length, reach),
  ].map(([x, y]) => mapping.point(x, y, 0))
  return { footprint, terrace: rectOf(corners) }
}
