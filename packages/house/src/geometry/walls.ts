import type { HouseFrame } from '../frame/types'
import { toMetres, type Vec2, type Vec3 } from '../units'
import type { MeshBuilder } from './mesh-builder'
import { metres, wallBasis, wallTopAt, type WorldMapping } from './space'
import { UP, basis, local, scale } from './vector'

const DOWN: Vec3 = [0, -1, 0]

/** Outer cladding, inner lining and opening reveals of every exterior wall. */
export function buildWalls(builder: MeshBuilder, mapping: WorldMapping, frame: HouseFrame) {
  const thickness = toMetres(frame.spec.wallThickness)
  for (const wall of frame.walls) {
    const outer = wallBasis(mapping, wall)
    const outline = wall.polygon.map(metres)
    const holes = wall.openings.map((item) => {
      const corners: Vec2[] = [
        [item.u0, item.v0],
        [item.u1, item.v0],
        [item.u1, item.v1],
        [item.u0, item.v1],
      ]
      return corners.map(metres)
    })
    builder.polygon('facade', outer, outline, holes)

    // The lining faces inwards: mirror u so the basis normal points into the house.
    const inner = basis(local(outer, 0, 0, -thickness), scale(outer.aAxis, -1), UP)
    const mirror = (points: readonly Vec2[]) => points.map(([a, b]): Vec2 => [-a, b])
    builder.polygon('interior', inner, mirror(outline), holes.map(mirror))

    for (const item of wall.openings) {
      const [u0, u1, v0, v1] = [
        toMetres(item.u0),
        toMetres(item.u1),
        toMetres(item.v0),
        toMetres(item.v1),
      ]
      const at = (u: number, v: number, n: number) => local(outer, u, v, n)
      builder.quad(
        'trim',
        [at(u0, v1, 0), at(u1, v1, 0), at(u1, v1, -thickness), at(u0, v1, -thickness)],
        DOWN,
      )
      builder.quad(
        'trim',
        [at(u0, v0, 0), at(u1, v0, 0), at(u1, v0, -thickness), at(u0, v0, -thickness)],
        UP,
      )
      builder.quad(
        'trim',
        [at(u0, v0, 0), at(u0, v1, 0), at(u0, v1, -thickness), at(u0, v0, -thickness)],
        outer.aAxis,
      )
      builder.quad(
        'trim',
        [at(u1, v0, 0), at(u1, v1, 0), at(u1, v1, -thickness), at(u1, v0, -thickness)],
        scale(outer.aAxis, -1),
      )
    }
  }
}

/**
 * Corner boards on every wall end. Each wall extends its right-hand board over the corner, so
 * every corner is closed by exactly one board and no faces overlap.
 */
export function buildCornerBoards(builder: MeshBuilder, mapping: WorldMapping, frame: HouseFrame) {
  const { cornerBoardWidth, cornerBoardThickness, plinthHeight } = frame.spec.standards
  for (const wall of frame.walls) {
    const outer = wallBasis(mapping, wall)
    const ends: ReadonlyArray<readonly [number, number]> = [
      [0, cornerBoardWidth],
      [wall.length - cornerBoardWidth, wall.length + cornerBoardThickness],
    ]
    for (const [start, end] of ends) {
      const top = Math.min(
        wallTopAt(wall, Math.max(0, start)),
        wallTopAt(wall, Math.min(wall.length, end)),
      )
      builder.box(
        'trim',
        outer,
        [toMetres(start), toMetres(end)],
        [toMetres(plinthHeight), toMetres(top)],
        [0, toMetres(cornerBoardThickness)],
      )
    }
  }
}
