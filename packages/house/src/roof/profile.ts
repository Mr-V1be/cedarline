import type { Vec2 } from '../units'

/**
 * Cross-section of a prismatic roof: points (s, h) where s runs across the span from 0 to the
 * span width and h is the height of the roof underside above the eave base. Points are
 * ordered by s; the first point is at s = 0 and the last at s = span.
 */
export interface RoofProfile {
  readonly span: number
  readonly points: readonly Vec2[]
}

/** Height of the profile at s, linearly interpolated (s is clamped to the span). */
export function profileHeightAt(profile: RoofProfile, s: number): number {
  const { points } = profile
  const first = points[0]
  const last = points[points.length - 1]
  if (first === undefined || last === undefined) return 0
  if (s <= first[0]) return first[1]
  if (s >= last[0]) return last[1]
  for (let index = 1; index < points.length; index += 1) {
    const end = points[index]
    const start = points[index - 1]
    if (end === undefined || start === undefined) continue
    if (s <= end[0]) {
      const ratio = (s - start[0]) / (end[0] - start[0])
      return start[1] + ratio * (end[1] - start[1])
    }
  }
  return last[1]
}

export const profileRidgeHeight = (profile: RoofProfile): number =>
  Math.max(...profile.points.map(([, h]) => h))

/** Consecutive profile segments as [start, end] pairs. */
export function profileSegments(profile: RoofProfile): ReadonlyArray<readonly [Vec2, Vec2]> {
  const segments: Array<readonly [Vec2, Vec2]> = []
  for (let index = 1; index < profile.points.length; index += 1) {
    const start = profile.points[index - 1]
    const end = profile.points[index]
    if (start !== undefined && end !== undefined) segments.push([start, end])
  }
  return segments
}

/**
 * The profile extended by the eave overhang: the first and last segments continue along their
 * slope until they project `overhang` beyond the walls horizontally.
 */
export function extendProfile(profile: RoofProfile, overhang: number): readonly Vec2[] {
  const points = [...profile.points]
  const [first, second] = points
  const last = points[points.length - 1]
  const beforeLast = points[points.length - 2]
  if (
    first === undefined ||
    second === undefined ||
    last === undefined ||
    beforeLast === undefined
  ) {
    return points
  }
  const startSlope = (second[1] - first[1]) / (second[0] - first[0])
  const endSlope = (last[1] - beforeLast[1]) / (last[0] - beforeLast[0])
  return [
    [first[0] - overhang, first[1] - startSlope * overhang],
    ...points.slice(1, -1),
    [last[0] + overhang, last[1] + endSlope * overhang],
  ]
}

/** Length of a polyline in the s–h plane. */
export function polylineLength(points: readonly Vec2[]): number {
  let length = 0
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1]
    const end = points[index]
    if (start !== undefined && end !== undefined) {
      length += Math.hypot(end[0] - start[0], end[1] - start[1])
    }
  }
  return length
}
