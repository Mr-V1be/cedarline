import type { RidgeAxis, WallSide } from '../spec/design'
import type { HouseSpec } from '../spec/house-spec'
import type { Vec2 } from '../units'

/**
 * Where a wall sits in plan coordinates. `u` runs along the outer face from the wall's left end
 * (seen from outside); `outward` points away from the house.
 */
export interface WallPlacement {
  readonly side: WallSide
  readonly length: number
  readonly origin: Vec2
  readonly direction: Vec2
  readonly outward: Vec2
}

type Footprint = Pick<HouseSpec, 'width' | 'depth'>

const PLACEMENTS: Record<WallSide, (footprint: Footprint) => Omit<WallPlacement, 'side'>> = {
  front: ({ width, depth }) => ({
    length: width,
    origin: [0, depth],
    direction: [1, 0],
    outward: [0, 1],
  }),
  right: ({ width, depth }) => ({
    length: depth,
    origin: [width, depth],
    direction: [0, -1],
    outward: [1, 0],
  }),
  back: ({ width }) => ({
    length: width,
    origin: [width, 0],
    direction: [-1, 0],
    outward: [0, -1],
  }),
  left: ({ depth }) => ({ length: depth, origin: [0, 0], direction: [0, 1], outward: [-1, 0] }),
}

export function wallPlacement(footprint: Footprint, side: WallSide): WallPlacement {
  return { side, ...PLACEMENTS[side](footprint) }
}

/** Plan point at distance u along the wall and `out` away from its outer face. */
export function planPointOnWall(placement: WallPlacement, u: number, out = 0): Vec2 {
  return [
    placement.origin[0] + placement.direction[0] * u + placement.outward[0] * out,
    placement.origin[1] + placement.direction[1] * u + placement.outward[1] * out,
  ]
}

/** Coordinate across the roof span for a plan point. */
export const spanCoordinate = (axis: RidgeAxis, point: Vec2): number =>
  axis === 'x' ? point[1] : point[0]

/** Plan point from roof coordinates: s across the span, t along the ridge. */
export const planFromRoof = (axis: RidgeAxis, s: number, t: number): Vec2 =>
  axis === 'x' ? [t, s] : [s, t]

export const roofSpan = (spec: Pick<HouseSpec, 'width' | 'depth' | 'ridgeAxis'>): number =>
  spec.ridgeAxis === 'x' ? spec.depth : spec.width

export const roofLength = (spec: Pick<HouseSpec, 'width' | 'depth' | 'ridgeAxis'>): number =>
  spec.ridgeAxis === 'x' ? spec.width : spec.depth
