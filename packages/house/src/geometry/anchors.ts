import { planPointOnWall } from '../frame/placement'
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
