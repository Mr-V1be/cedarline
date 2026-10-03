import type { TerraceDesign } from '../spec/design'
import type { HouseSpec } from '../spec/house-spec'
import type { Rect } from '../units'
import { planPointOnWall, type WallPlacement } from './placement'
import type { LandingFrame, LandingKind, OpeningFrame, StairFrame, WallFrame } from './types'

/** A stretch along a wall's outer face, mm from its left end seen from outside. */
interface Span {
  readonly u0: number
  readonly u1: number
}

/** An exterior door together with the wall it is in. */
export interface Entrance {
  readonly wall: WallFrame
  readonly door: OpeningFrame
}

export const entrancesOf = (walls: readonly WallFrame[]): Entrance[] =>
  walls.flatMap((wall) =>
    wall.openings.filter((item) => item.opening.type === 'door').map((door) => ({ wall, door })),
  )

export const spanCentre = (span: Span): number => (span.u0 + span.u1) / 2

/**
 * Ground-floor windows of the wall to the left and right of a door. A window above the door
 * (a transom) is not beside it: steps under it still lead to the door.
 */
export const windowsBeside = (wall: WallFrame, door: Span): OpeningFrame[] =>
  wall.openings.filter(
    (item) =>
      item.opening.type === 'window' &&
      item.opening.level === 0 &&
      (item.u1 <= door.u0 || item.u0 >= door.u1),
  )

/** A span of the given length as close to `start` as fits between `min` and `max`. */
function placeWithin(start: number, length: number, min: number, max: number): Span {
  const u0 = Math.max(min, Math.min(start, max - length))
  return { u0, u1: u0 + length }
}

/** Plan rectangle over a span of the wall, between two distances from its face. */
export function wallRect(wall: WallPlacement, span: Span, near: number, far: number): Rect {
  const [ax, ay] = planPointOnWall(wall, span.u0, near)
  const [bx, by] = planPointOnWall(wall, span.u1, far)
  return { x0: Math.min(ax, bx), y0: Math.min(ay, by), x1: Math.max(ax, bx), y1: Math.max(ay, by) }
}

/**
 * The terrace starts at its door: a landing beside the leaf at the door end, then the rest of
 * its length the way it reaches. A wall end shifts it along, never off the door.
 */
function terraceSpan(
  terrace: TerraceDesign,
  door: OpeningFrame,
  wall: WallFrame,
  clearance: number,
): Span {
  const length = Math.min(terrace.length, wall.length)
  const start = {
    right: door.u0 - clearance,
    left: door.u1 + clearance - length,
    both: spanCentre(door) - length / 2,
  }[terrace.reach]
  return placeWithin(start, length, 0, wall.length)
}

/** A porch is centred on its door with a landing on each side of the leaf. */
function porchSpan(door: OpeningFrame, wall: WallFrame, clearance: number): Span {
  const length = Math.min(door.u1 - door.u0 + 2 * clearance, wall.length)
  return placeWithin(spanCentre(door) - length / 2, length, 0, wall.length)
}

/**
 * Steps go down from the deck edge in front of the door that leads them. They stay on the deck
 * and between the windows beside the door, as wide as the standard allows there.
 */
function stairOf(
  spec: HouseSpec,
  wall: WallFrame,
  deck: Span & { readonly depth: number; readonly deckTop: number },
  door: OpeningFrame,
): StairFrame {
  const { stairMaxRiser, stairTread, stairMaxWidth } = spec.standards
  const beside = windowsBeside(wall, door)
  const min = Math.max(deck.u0, ...beside.filter((item) => item.u1 <= door.u0).map((w) => w.u1))
  const max = Math.min(deck.u1, ...beside.filter((item) => item.u0 >= door.u1).map((w) => w.u0))
  const width = Math.min(stairMaxWidth, max - min)
  const span = placeWithin(spanCentre(door) - width / 2, width, min, max)
  const steps = Math.max(0, Math.ceil(deck.deckTop / stairMaxRiser) - 1)
  const foot = deck.depth + steps * stairTread
  return {
    ...span,
    steps,
    riser: deck.deckTop / (steps + 1),
    tread: stairTread,
    foot,
    rect: wallRect(wall, span, deck.depth, foot),
  }
}

function landingOf(
  kind: LandingKind,
  spec: HouseSpec,
  wall: WallFrame,
  deck: Span & { readonly depth: number; readonly deckTop: number },
  lead: OpeningFrame,
  alongside: readonly OpeningFrame[] = [],
): LandingFrame {
  return {
    kind,
    side: wall.side,
    ...deck,
    rect: wallRect(wall, deck, 0, deck.depth),
    doors: [lead, ...alongside].map((door) => door.opening.id),
    stair: stairOf(spec, wall, deck, lead),
  }
}

/**
 * Every exterior door opens onto a landing at the finished floor: the terrace when the door is
 * on it, otherwise a porch of its own. Positions follow the doors, not the facade.
 */
export function deriveLandings(
  spec: HouseSpec,
  walls: readonly WallFrame[],
  groundFloor: number,
): LandingFrame[] {
  const { standards, terrace } = spec
  const deckTop = groundFloor - standards.deckDrop
  const entrances = entrancesOf(walls)
  const landings: LandingFrame[] = []
  const served = new Set<OpeningFrame>()

  const main = entrances.find(({ door }) => door.opening.id === terrace?.entrance)
  if (terrace !== null && main !== undefined) {
    const span = terraceSpan(terrace, main.door, main.wall, standards.landingSideClearance)
    const alongside = entrances
      .filter(({ wall, door }) => wall === main.wall && door !== main.door)
      .filter(({ door }) => door.u0 >= span.u0 && door.u1 <= span.u1)
      .map(({ door }) => door)
    for (const door of [main.door, ...alongside]) served.add(door)
    landings.push(
      landingOf(
        'terrace',
        spec,
        main.wall,
        { ...span, depth: terrace.depth, deckTop },
        main.door,
        alongside,
      ),
    )
  }

  for (const { wall, door } of entrances) {
    if (served.has(door)) continue
    const span = porchSpan(door, wall, standards.landingSideClearance)
    landings.push(
      landingOf('porch', spec, wall, { ...span, depth: standards.porchDepth, deckTop }, door),
    )
  }
  return landings
}
