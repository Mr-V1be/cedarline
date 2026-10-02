import type { HouseFrame, OpeningFrame } from '../frame/types'
import { toMetres, type Vec3 } from '../units'
import type { MeshBuilder } from './mesh-builder'
import { wallBasis, type WorldMapping } from './space'
import { local, type Basis } from './vector'

/** Visual details of joinery, mm: they do not influence quantities or prices. */
const SILL_OVERHANG = 40
const SILL_EXTENSION = 30
const SILL_THICKNESS = 20
const DOOR_LEAF_THICKNESS = 50
const HANDLE = { height: 1050, offset: 90, length: 160, size: 22, projection: 50 } as const

function frameRing(
  builder: MeshBuilder,
  wall: Basis,
  item: OpeningFrame,
  depth: readonly [number, number],
  profile: number,
  withBottom: boolean,
) {
  const { u0, u1, v0, v1 } = item
  const m = toMetres
  const n = [m(depth[0]), m(depth[1])] as const
  builder.box('frame', wall, [m(u0), m(u1)], [m(v1 - profile), m(v1)], n)
  if (withBottom) builder.box('frame', wall, [m(u0), m(u1)], [m(v0), m(v0 + profile)], n)
  const sideBottom = withBottom ? v0 + profile : v0
  builder.box('frame', wall, [m(u0), m(u0 + profile)], [m(sideBottom), m(v1 - profile)], n)
  builder.box('frame', wall, [m(u1 - profile), m(u1)], [m(sideBottom), m(v1 - profile)], n)
}

function buildWindow(builder: MeshBuilder, wall: Basis, item: OpeningFrame, frame: HouseFrame) {
  const {
    windowFrameWidth: profile,
    windowFrameDepth,
    windowRecess,
    maxPaneWidth,
  } = frame.spec.standards
  const depth = [-windowRecess - windowFrameDepth, -windowRecess] as const
  const m = toMetres
  frameRing(builder, wall, item, depth, profile, true)

  const clearWidth = item.u1 - item.u0 - 2 * profile
  const panes = Math.max(1, Math.ceil(clearWidth / maxPaneWidth))
  const pane = (clearWidth - (panes - 1) * profile) / panes
  for (let index = 1; index < panes; index += 1) {
    const start = item.u0 + profile + index * pane + (index - 1) * profile
    builder.box(
      'frame',
      wall,
      [m(start), m(start + profile)],
      [m(item.v0 + profile), m(item.v1 - profile)],
      [m(depth[0]), m(depth[1])],
    )
  }

  const glassDepth = m(-windowRecess - windowFrameDepth / 2)
  const g = (u: number, v: number): Vec3 => local(wall, m(u), m(v), glassDepth)
  const [gu0, gu1, gv0, gv1] = [
    item.u0 + profile,
    item.u1 - profile,
    item.v0 + profile,
    item.v1 - profile,
  ]
  builder.quad('glass', [g(gu0, gv0), g(gu1, gv0), g(gu1, gv1), g(gu0, gv1)], wall.normal)

  builder.box(
    'metal',
    wall,
    [m(item.u0 - SILL_EXTENSION), m(item.u1 + SILL_EXTENSION)],
    [m(item.v0 - SILL_THICKNESS), m(item.v0)],
    [m(-windowRecess), m(SILL_OVERHANG)],
  )
}

function buildDoor(builder: MeshBuilder, wall: Basis, item: OpeningFrame, frame: HouseFrame) {
  const { windowFrameWidth: profile, windowFrameDepth, windowRecess } = frame.spec.standards
  const depth = [-windowRecess - windowFrameDepth, -windowRecess] as const
  const m = toMetres
  frameRing(builder, wall, item, depth, profile, false)
  const leafFront = -windowRecess - (windowFrameDepth - DOOR_LEAF_THICKNESS) / 2
  builder.box(
    'door',
    wall,
    [m(item.u0 + profile), m(item.u1 - profile)],
    [m(item.v0), m(item.v1 - profile)],
    [m(leafFront - DOOR_LEAF_THICKNESS), m(leafFront)],
  )
  const handleU = item.u1 - profile - HANDLE.offset
  builder.box(
    'metal',
    wall,
    [m(handleU - HANDLE.size / 2), m(handleU + HANDLE.size / 2)],
    [
      m(item.v0 + HANDLE.height - HANDLE.length / 2),
      m(item.v0 + HANDLE.height + HANDLE.length / 2),
    ],
    [m(leafFront), m(leafFront + HANDLE.projection)],
  )
}

/** Windows, exterior doors and sills of every wall. */
export function buildOpenings(builder: MeshBuilder, mapping: WorldMapping, frame: HouseFrame) {
  for (const wall of frame.walls) {
    const basis = wallBasis(mapping, wall)
    for (const item of wall.openings) {
      if (item.opening.type === 'window') buildWindow(builder, basis, item, frame)
      else buildDoor(builder, basis, item, frame)
    }
  }
}
