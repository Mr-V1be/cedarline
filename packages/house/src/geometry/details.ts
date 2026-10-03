import { wallPlacement } from '../frame/placement'
import type { HouseFrame } from '../frame/types'
import { toMetres, type Vec3 } from '../units'
import type { MeshBuilder } from './mesh-builder'
import { wallBasis, type WorldMapping } from './space'
import { UP, basis } from './vector'

/** Visual details, mm: they do not influence quantities or prices. */
const PLINTH_INSET = 25
const DECK_THICKNESS = 45
const DECK_SKIRT_INSET = 60
const CHIMNEY = { segments: 20, capHeight: 120, capOverhang: 50 } as const
const DOWN: Vec3 = [0, -1, 0]

/** Plinth band on the strapping beam, slightly recessed behind the facade. */
export function buildPlinth(builder: MeshBuilder, mapping: WorldMapping, frame: HouseFrame) {
  const { width, depth, standards } = frame.spec
  const origin = mapping.point(0, 0, 0)
  const ground = basis(origin, [1, 0, 0], [0, 0, 1])
  const m = toMetres
  // Basis normal is −Y here, so n runs downwards: elevation e maps to n = −e.
  builder.box(
    'plinth',
    ground,
    [m(PLINTH_INSET), m(width - PLINTH_INSET)],
    [m(PLINTH_INSET), m(depth - PLINTH_INSET)],
    [m(-standards.plinthHeight), 0],
  )
}

/** Floor finish of each level and ceilings of the storeys, visible through the glazing. */
export function buildFloors(builder: MeshBuilder, mapping: WorldMapping, frame: HouseFrame) {
  const { width, depth, wallThickness: t } = frame.spec
  for (const level of frame.levels) {
    const at = (x: number, y: number, elevation: number) => mapping.point(x, y, elevation)
    const rect = (elevation: number) =>
      [
        at(t, t, elevation),
        at(width - t, t, elevation),
        at(width - t, depth - t, elevation),
        at(t, depth - t, elevation),
      ] as const
    builder.quad('floor', rect(level.floor), UP)
    if (!level.attic) builder.quad('interior', rect(level.ceiling), DOWN)
  }
}

/** Decks of the terrace and porches with their skirts and steps, from the frame's landings. */
export function buildLandings(builder: MeshBuilder, mapping: WorldMapping, frame: HouseFrame) {
  const m = toMetres
  for (const landing of frame.landings) {
    const wall = wallBasis(mapping, wallPlacement(frame.spec, landing.side))
    const { u0, u1, depth, deckTop, stair } = landing
    builder.box(
      'deck',
      wall,
      [m(u0), m(u1)],
      [m(deckTop - DECK_THICKNESS), m(deckTop)],
      [0, m(depth)],
    )
    builder.box(
      'plinth',
      wall,
      [m(u0 + DECK_SKIRT_INSET), m(u1 - DECK_SKIRT_INSET)],
      [0, m(deckTop - DECK_THICKNESS)],
      [m(DECK_SKIRT_INSET), m(depth - DECK_SKIRT_INSET)],
    )
    for (let index = 1; index <= stair.steps; index += 1) {
      builder.box(
        'deck',
        wall,
        [m(stair.u0), m(stair.u1)],
        [0, m(deckTop - index * stair.riser)],
        [m(depth + (index - 1) * stair.tread), m(depth + index * stair.tread)],
      )
    }
  }
}

/** Insulated metal flue of a stove (bath houses, fireplaces). */
export function buildChimney(builder: MeshBuilder, mapping: WorldMapping, frame: HouseFrame) {
  const { chimney } = frame
  if (chimney === null) return
  const radius = toMetres(chimney.diameter / 2)
  const base = mapping.point(chimney.x, chimney.y, chimney.base)
  const height = toMetres(chimney.top - chimney.base)
  builder.cylinder('metal', base, radius, height, CHIMNEY.segments)
  const capBase: Vec3 = [base[0], base[1] + height, base[2]]
  builder.cylinder(
    'metal',
    capBase,
    radius + toMetres(CHIMNEY.capOverhang),
    toMetres(CHIMNEY.capHeight),
    CHIMNEY.segments,
  )
}
