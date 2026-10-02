import type { WallPlacement } from '../frame/placement'
import type { WallFrame } from '../frame/types'
import type { HouseSpec } from '../spec/house-spec'
import { toMetres, type Vec2, type Vec3 } from '../units'
import { UP, basis, type Basis } from './vector'

/**
 * World space of the 3D model: metres, Y up, the footprint centred on the origin and the front
 * facade facing +Z. Plan x maps to +X and plan y (back → front) to +Z.
 */
export interface WorldMapping {
  point(x: number, y: number, elevation: number): Vec3
  direction(planDirection: Vec2): Vec3
}

export function worldMapping(spec: Pick<HouseSpec, 'width' | 'depth'>): WorldMapping {
  return {
    point: (x, y, elevation) => [
      toMetres(x - spec.width / 2),
      toMetres(elevation),
      toMetres(y - spec.depth / 2),
    ],
    direction: ([dx, dy]) => [dx, 0, dy],
  }
}

/** Basis of a wall's outer face: a along the wall, b up, normal outward; units are metres. */
export function wallBasis(mapping: WorldMapping, wall: WallPlacement): Basis {
  return basis(
    mapping.point(wall.origin[0], wall.origin[1], 0),
    mapping.direction(wall.direction),
    UP,
  )
}

/** Elevation of a wall's top edge at u, interpolated along the outline's top vertices. */
export function wallTopAt(wall: WallFrame, u: number): number {
  const top = wall.polygon.slice(2)
  for (let index = 1; index < top.length; index += 1) {
    const right = top[index - 1]
    const left = top[index]
    if (right === undefined || left === undefined) continue
    if (u >= left[0] && u <= right[0]) {
      const span = right[0] - left[0]
      return span === 0
        ? Math.min(left[1], right[1])
        : left[1] + ((u - left[0]) / span) * (right[1] - left[1])
    }
  }
  return Math.min(...top.map(([, v]) => v))
}

export const metres = ([a, b]: Vec2): Vec2 => [toMetres(a), toMetres(b)]
