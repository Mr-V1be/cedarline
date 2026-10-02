import earcut from 'earcut'

import type { Vec2, Vec3 } from '../units'
import type { MaterialSlot } from './slots'
import { basis, cross, dot, local, normalize, sub, type Basis } from './vector'

export interface MeshPart {
  readonly slot: MaterialSlot
  readonly positions: Float32Array
  readonly normals: Float32Array
  readonly uvs: Float32Array
  readonly indices: Uint32Array
}

interface Bucket {
  positions: number[]
  normals: number[]
  uvs: number[]
  indices: number[]
}

const signedArea = (points: readonly Vec2[]): number =>
  points.reduce((sum, [x, y], index) => {
    const next = points[(index + 1) % points.length]
    return next === undefined ? sum : sum + x * next[1] - next[0] * y
  }, 0) / 2

/**
 * Accumulates flat-shaded triangles per material slot. Every surface is emitted with an
 * explicit facing so that winding and normals are correct by construction.
 */
export class MeshBuilder {
  private readonly buckets = new Map<MaterialSlot, Bucket>()

  private bucket(slot: MaterialSlot): Bucket {
    let bucket = this.buckets.get(slot)
    if (bucket === undefined) {
      bucket = { positions: [], normals: [], uvs: [], indices: [] }
      this.buckets.set(slot, bucket)
    }
    return bucket
  }

  private vertex(bucket: Bucket, position: Vec3, normal: Vec3, uv: Vec2): number {
    const index = bucket.positions.length / 3
    bucket.positions.push(position[0], position[1], position[2])
    bucket.normals.push(normal[0], normal[1], normal[2])
    bucket.uvs.push(uv[0], uv[1])
    return index
  }

  /**
   * Planar polygon with holes, given in the (a, b) coordinates of a basis. The surface faces
   * the basis normal; UVs are the (a, b) coordinates, i.e. metres along the plane.
   */
  polygon(
    slot: MaterialSlot,
    frame: Basis,
    outline: readonly Vec2[],
    holes: readonly (readonly Vec2[])[] = [],
  ) {
    const ccwOutline = signedArea(outline) < 0 ? [...outline].reverse() : outline
    const rings = [
      ccwOutline,
      ...holes.map((hole) => (signedArea(hole) > 0 ? [...hole].reverse() : hole)),
    ]
    const flat: number[] = []
    const holeIndices: number[] = []
    for (const [ringIndex, ring] of rings.entries()) {
      if (ringIndex > 0) holeIndices.push(flat.length / 2)
      for (const [a, b] of ring) flat.push(a, b)
    }
    const triangles = earcut(flat, holeIndices)
    const bucket = this.bucket(slot)
    const base = bucket.positions.length / 3
    for (let index = 0; index < flat.length; index += 2) {
      const a = flat[index] ?? 0
      const b = flat[index + 1] ?? 0
      this.vertex(bucket, local(frame, a, b), frame.normal, [a, b])
    }
    for (let index = 0; index < triangles.length; index += 3) {
      const i0 = triangles[index] ?? 0
      const i1 = triangles[index + 1] ?? 0
      const i2 = triangles[index + 2] ?? 0
      const p0: Vec2 = [flat[i0 * 2] ?? 0, flat[i0 * 2 + 1] ?? 0]
      const p1: Vec2 = [flat[i1 * 2] ?? 0, flat[i1 * 2 + 1] ?? 0]
      const p2: Vec2 = [flat[i2 * 2] ?? 0, flat[i2 * 2 + 1] ?? 0]
      const counterClockwise = signedArea([p0, p1, p2]) > 0
      bucket.indices.push(
        base + i0,
        ...(counterClockwise ? [base + i1, base + i2] : [base + i2, base + i1]),
      )
    }
  }

  /**
   * Quad from four coplanar corners in order around its edge. The winding is chosen so that
   * the face looks towards `facing`. UVs default to metres along the first and last edges.
   */
  quad(
    slot: MaterialSlot,
    corners: readonly [Vec3, Vec3, Vec3, Vec3],
    facing: Vec3,
    uvs?: readonly [Vec2, Vec2, Vec2, Vec2],
  ) {
    const [p0, p1, , p3] = corners
    let normal = normalize(cross(sub(p1, p0), sub(p3, p0)))
    const flipped = dot(normal, facing) < 0
    if (flipped) normal = [-normal[0], -normal[1], -normal[2]]
    const width = Math.hypot(...sub(p1, p0))
    const height = Math.hypot(...sub(p3, p0))
    const coordinates = uvs ?? [
      [0, 0],
      [width, 0],
      [width, height],
      [0, height],
    ]
    const bucket = this.bucket(slot)
    const indices = corners.map((corner, index) =>
      this.vertex(bucket, corner, normal, coordinates[index] ?? [0, 0]),
    )
    const [i0 = 0, i1 = 0, i2 = 0, i3 = 0] = indices
    bucket.indices.push(...(flipped ? [i0, i2, i1, i0, i3, i2] : [i0, i1, i2, i0, i2, i3]))
  }

  /** Box spanning [a0, a1] × [b0, b1] × [n0, n1] in a basis, all six faces outward. */
  box(slot: MaterialSlot, frame: Basis, [a0, a1]: Vec2, [b0, b1]: Vec2, [n0, n1]: Vec2) {
    const at = (a: number, b: number, n: number) => local(frame, a, b, n)
    const centre = at((a0 + a1) / 2, (b0 + b1) / 2, (n0 + n1) / 2)
    const faces: ReadonlyArray<readonly [Vec3, Vec3, Vec3, Vec3]> = [
      [at(a0, b0, n1), at(a1, b0, n1), at(a1, b1, n1), at(a0, b1, n1)],
      [at(a1, b0, n0), at(a0, b0, n0), at(a0, b1, n0), at(a1, b1, n0)],
      [at(a0, b1, n1), at(a1, b1, n1), at(a1, b1, n0), at(a0, b1, n0)],
      [at(a0, b0, n0), at(a1, b0, n0), at(a1, b0, n1), at(a0, b0, n1)],
      [at(a1, b0, n1), at(a1, b0, n0), at(a1, b1, n0), at(a1, b1, n1)],
      [at(a0, b0, n0), at(a0, b0, n1), at(a0, b1, n1), at(a0, b1, n0)],
    ]
    for (const face of faces) {
      const faceCentre: Vec3 = [
        (face[0][0] + face[2][0]) / 2,
        (face[0][1] + face[2][1]) / 2,
        (face[0][2] + face[2][2]) / 2,
      ]
      this.quad(slot, face, sub(faceCentre, centre))
    }
  }

  /** Vertical cylinder with flat caps. */
  cylinder(slot: MaterialSlot, base: Vec3, radius: number, height: number, segments: number) {
    const axis = basis(base, [1, 0, 0], [0, 0, -1])
    const ring = Array.from({ length: segments }, (_, index): Vec2 => {
      const angle = (index / segments) * Math.PI * 2
      return [Math.cos(angle) * radius, Math.sin(angle) * radius]
    })
    const top = basis([base[0], base[1] + height, base[2]], [1, 0, 0], [0, 0, -1])
    this.polygon(slot, top, ring)
    this.polygon(
      slot,
      basis(base, [0, 0, -1], [1, 0, 0]),
      ring.map(([a, b]): Vec2 => [b, a]),
    )
    ring.forEach(([a, b], index) => {
      const [na, nb] = ring[(index + 1) % segments] ?? ring[0] ?? [0, 0]
      const lower0 = local(axis, a, b)
      const lower1 = local(axis, na, nb)
      const middle: Vec3 = [base[0] + (a + na) / 2, base[1], base[2] - (b + nb) / 2]
      this.quad(
        slot,
        [
          lower0,
          lower1,
          [lower1[0], lower1[1] + height, lower1[2]],
          [lower0[0], lower0[1] + height, lower0[2]],
        ],
        sub(middle, base),
      )
    })
  }

  build(): MeshPart[] {
    return [...this.buckets.entries()].map(([slot, bucket]) => ({
      slot,
      positions: new Float32Array(bucket.positions),
      normals: new Float32Array(bucket.normals),
      uvs: new Float32Array(bucket.uvs),
      indices: new Uint32Array(bucket.indices),
    }))
  }
}
