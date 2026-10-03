import { entrancesOf, spanCentre } from '../frame/landings'
import { planPointOnWall, wallPlacement } from '../frame/placement'
import type { HouseFrame, LandingFrame } from '../frame/types'
import { toMetres, type Rect, type Vec3 } from '../units'
import type { WorldMapping } from './space'

/** Where a path to the house begins and which way it leads away from the house. */
export interface Approach {
  readonly start: Vec3
  readonly direction: Vec3
  /** Path width in metres. */
  readonly width: number
}

const PATH_WIDTH = 1200

/** The way in a visitor takes: the entrance on the front facade, else the first one. */
function mainLanding(frame: HouseFrame): LandingFrame | undefined {
  const entrances = entrancesOf(frame.walls)
  const entrance = entrances.find(({ wall }) => wall.side === 'front') ?? entrances[0]
  if (entrance === undefined) return undefined
  return frame.landings.find((landing) => landing.doors.includes(entrance.door.opening.id))
}

/** The path to the house begins at the foot of the steps of the main entrance. */
export function approachOf(frame: HouseFrame, mapping: WorldMapping): Approach | null {
  const landing = mainLanding(frame)
  if (landing === undefined) return null
  const wall = wallPlacement(frame.spec, landing.side)
  const [x, y] = planPointOnWall(wall, spanCentre(landing.stair), landing.stair.foot)
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

/** Ground taken by a terrace or porch: its deck and the flight of steps in front of it. */
export interface GroundLanding {
  readonly deck: GroundRect
  readonly stair: GroundRect
}

/** Where the house meets the ground, for site dressing (blind area, lawn, paths). */
export interface SiteAnchors {
  /** Outer faces of the walls. */
  readonly footprint: GroundRect
  /** Terrace and porches; no blind area is laid under them. */
  readonly landings: readonly GroundLanding[]
}

function groundRect(mapping: WorldMapping, rect: Rect): GroundRect {
  const [ax, , az] = mapping.point(rect.x0, rect.y0, 0)
  const [bx, , bz] = mapping.point(rect.x1, rect.y1, 0)
  return { min: [Math.min(ax, bx), Math.min(az, bz)], max: [Math.max(ax, bx), Math.max(az, bz)] }
}

export function siteAnchorsOf(frame: HouseFrame, mapping: WorldMapping): SiteAnchors {
  const { width, depth } = frame.spec
  return {
    footprint: groundRect(mapping, { x0: 0, y0: 0, x1: width, y1: depth }),
    landings: frame.landings.map((landing) => ({
      deck: groundRect(mapping, landing.rect),
      stair: groundRect(mapping, landing.stair.rect),
    })),
  }
}
