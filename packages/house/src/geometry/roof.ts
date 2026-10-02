import { planFromRoof } from '../frame/placement'
import type { RoofFrame } from '../frame/types'
import { extendProfile } from '../roof/profile'
import type { RidgeAxis } from '../spec/design'
import { toMetres, type Vec2, type Vec3 } from '../units'
import type { MeshBuilder } from './mesh-builder'
import type { WorldMapping } from './space'
import { UP, basis, dot, normalize, scale } from './vector'

/** World direction of a vector (ds across the span, dh up). */
function spanVector(axis: RidgeAxis, ds: number, dh: number): Vec3 {
  return axis === 'x' ? [0, dh, ds] : [ds, dh, 0]
}

const ridgeVector = (axis: RidgeAxis): Vec3 => (axis === 'x' ? [1, 0, 0] : [0, 0, 1])

/** Upward unit normal of a profile segment in the s–h plane. */
function segmentNormal(start: Vec2, end: Vec2): Vec2 {
  const ds = end[0] - start[0]
  const dh = end[1] - start[1]
  const length = Math.hypot(ds, dh)
  return [-dh / length, ds / length]
}

/** Offsets a polyline along its upward normals with mitred joints. */
export function offsetPolyline(points: readonly Vec2[], distance: number): Vec2[] {
  return points.map((point, index): Vec2 => {
    const before = points[index - 1]
    const after = points[index + 1]
    const normals = [
      before === undefined ? undefined : segmentNormal(before, point),
      after === undefined ? undefined : segmentNormal(point, after),
    ].filter((normal): normal is Vec2 => normal !== undefined)
    const [first, second] = normals
    if (first === undefined) return point
    if (second === undefined)
      return [point[0] + first[0] * distance, point[1] + first[1] * distance]
    const bisector = [first[0] + second[0], first[1] + second[1]]
    const length = Math.hypot(bisector[0] ?? 0, bisector[1] ?? 0)
    const unit: Vec2 = [(bisector[0] ?? 0) / length, (bisector[1] ?? 0) / length]
    const miter = distance / (unit[0] * first[0] + unit[1] * first[1])
    return [point[0] + unit[0] * miter, point[1] + unit[1] * miter]
  })
}

/**
 * Prismatic roof slab: the profile (extended by the eave overhang) is the soffit, its offset by
 * the roof thickness is the roofing, and the ends are closed by barge boards and fascias.
 */
export function buildRoof(builder: MeshBuilder, mapping: WorldMapping, roof: RoofFrame) {
  const axis = roof.ridgeAxis
  const underside = extendProfile(roof.profile, roof.eaveOverhang)
  const top = offsetPolyline(underside, roof.thickness)
  const t0 = -roof.gableOverhang
  const t1 = roof.length + roof.gableOverhang
  const at = ([s, h]: Vec2, t: number): Vec3 => {
    const [x, y] = planFromRoof(axis, s, t)
    return mapping.point(x, y, roof.eaveBase + h)
  }
  const along = toMetres(t1 - t0)

  let slopeDistance = 0
  for (let index = 1; index < underside.length; index += 1) {
    const [u0, u1, o0, o1] = [underside[index - 1], underside[index], top[index - 1], top[index]]
    if (u0 === undefined || u1 === undefined || o0 === undefined || o1 === undefined) continue
    const normal = segmentNormal(u0, u1)
    const outward = spanVector(axis, normal[0], normal[1])
    const length = toMetres(Math.hypot(o1[0] - o0[0], o1[1] - o0[1]))
    builder.quad('roof', [at(o0, t0), at(o0, t1), at(o1, t1), at(o1, t0)], outward, [
      [0, slopeDistance],
      [along, slopeDistance],
      [along, slopeDistance + length],
      [0, slopeDistance + length],
    ])
    builder.quad('roofTrim', [at(u0, t0), at(u0, t1), at(u1, t1), at(u1, t0)], scale(outward, -1))
    slopeDistance += length
  }

  // Barge boards close the slab at both gable ends.
  const ring = [...underside, ...[...top].reverse()].map(([s, h]): Vec2 => [
    toMetres(s),
    toMetres(h),
  ])
  const ridge = ridgeVector(axis)
  for (const [t, facing] of [
    [t0, scale(ridge, -1)],
    [t1, ridge],
  ] as const) {
    const origin = at([0, 0], t)
    const natural = basis(origin, spanVector(axis, 1, 0), UP)
    const flip = dot(natural.normal, facing) < 0
    const frame = flip ? basis(origin, spanVector(axis, -1, 0), UP) : natural
    builder.polygon('roofTrim', frame, flip ? ring.map(([a, b]): Vec2 => [-a, b]) : ring)
  }

  // Fascias close the slab along both eaves.
  const ends: ReadonlyArray<readonly [Vec2 | undefined, Vec2 | undefined, Vec2 | undefined]> = [
    [underside[0], top[0], underside[1]],
    [underside[underside.length - 1], top[top.length - 1], underside[underside.length - 2]],
  ]
  for (const [edge, edgeTop, neighbour] of ends) {
    if (edge === undefined || edgeTop === undefined || neighbour === undefined) continue
    // Faces away from the roof: along the slope, from the neighbouring point towards the edge.
    const tangent = normalize(spanVector(axis, edge[0] - neighbour[0], edge[1] - neighbour[1]))
    builder.quad(
      'roofTrim',
      [at(edge, t0), at(edge, t1), at(edgeTop, t1), at(edgeTop, t0)],
      tangent,
    )
  }
}
