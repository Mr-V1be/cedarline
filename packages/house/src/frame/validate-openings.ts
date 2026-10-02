import { HouseError } from '../errors'
import type { Vec2 } from '../units'
import type { LevelFrame, OpeningFrame, WallFrame } from './types'

/** Tolerance for points lying exactly on a wall edge, mm. */
const EDGE_TOLERANCE = 1e-6

/** Wall outlines are convex (rectangles, gables under concave-down profiles), so a half-plane test suffices. */
function insideConvex(polygon: readonly Vec2[], [u, v]: Vec2): boolean {
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index]
    const end = polygon[(index + 1) % polygon.length]
    if (start === undefined || end === undefined) continue
    const cross = (end[0] - start[0]) * (v - start[1]) - (end[1] - start[1]) * (u - start[0])
    if (cross < -EDGE_TOLERANCE) return false
  }
  return true
}

const overlap = (a: OpeningFrame, b: OpeningFrame): boolean =>
  a.u0 < b.u1 && b.u0 < a.u1 && a.v0 < b.v1 && b.v0 < a.v1

/** Every opening must lie on its wall, below its ceiling, and apart from the others. */
export function validateOpenings(walls: readonly WallFrame[], levels: readonly LevelFrame[]) {
  for (const wall of walls) {
    wall.openings.forEach((frame, index) => {
      const { opening } = frame
      const corners: Vec2[] = [
        [frame.u0, frame.v0],
        [frame.u1, frame.v0],
        [frame.u1, frame.v1],
        [frame.u0, frame.v1],
      ]
      const level = levels[opening.level]
      const belowCeiling = level === undefined || level.attic || frame.v1 <= level.ceiling
      if (!belowCeiling || !corners.every((corner) => insideConvex(wall.polygon, corner))) {
        throw new HouseError('OPENING_OUT_OF_WALL', `Opening ${opening.id} does not fit its wall`, {
          id: opening.id,
          side: wall.side,
        })
      }
      const clash = wall.openings.slice(index + 1).find((other) => overlap(frame, other))
      if (clash !== undefined) {
        throw new HouseError(
          'OPENINGS_OVERLAP',
          `Opening ${opening.id} overlaps ${clash.opening.id}`,
          {
            id: opening.id,
            other: clash.opening.id,
          },
        )
      }
    })
  }
}
