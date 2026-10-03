import { HouseError } from '../errors'
import { entrancesOf, spanCentre, windowsBeside } from './landings'
import { terraceOf, type HouseFrame, type LandingFrame } from './types'

/**
 * Architectural rules of a way into the house. They are checked on every derived frame, so no
 * project and no combination of options can produce a door onto bare ground or steps to a
 * window.
 */
export const ENTRANCE_RULES = [
  /** An exterior door opens onto exactly one landing: the terrace or a porch. */
  'door-opens-onto-landing',
  /** The terrace is laid at the door it was designed for. */
  'terrace-at-its-entrance',
  /** The deck is flush with the finished floor, apart from the drip step under the threshold. */
  'landing-at-floor-level',
  /** The deck in front of a door is at least one and a half leaves deep. */
  'landing-deep-enough',
  'landing-on-wall',
  'landings-apart',
  /** Steps lead down from the deck in front of the door that leads them. */
  'stair-at-entrance',
  'stair-wide-enough',
  /** Every riser of the flight is within the standard. */
  'stair-risers',
  /** No steps in front of a ground-floor window. */
  'stair-clear-of-windows',
] as const
export type EntranceRule = (typeof ENTRANCE_RULES)[number]

export interface EntranceViolation {
  readonly rule: EntranceRule
  /** The door or landing at fault, for messages and tests. */
  readonly subject: string
}

/** A threshold, not a step: the most the deck may sit below the finished floor. */
export const MAX_THRESHOLD_STEP = 30
/** Landing depth per width of the door leaf. */
const LANDING_DEPTH_PER_LEAF = 1.5

const subjectOf = (landing: LandingFrame) => `${landing.kind} of ${landing.doors.join(', ')}`

function landingViolations(frame: HouseFrame, landing: LandingFrame): EntranceViolation[] {
  const { spec, walls, levels } = frame
  const { standards } = spec
  const wall = walls.find((item) => item.side === landing.side)
  const doors = wall?.openings.filter((item) => landing.doors.includes(item.opening.id)) ?? []
  const [lead] = doors
  const floor = levels[0]?.floor ?? standards.plinthHeight
  const { stair } = landing
  const broken: EntranceRule[] = []

  const drop = floor - landing.deckTop
  if (drop < 0 || drop > MAX_THRESHOLD_STEP) broken.push('landing-at-floor-level')
  const widestLeaf = Math.max(0, ...doors.map((door) => door.u1 - door.u0))
  if (landing.depth < LANDING_DEPTH_PER_LEAF * widestLeaf) broken.push('landing-deep-enough')
  if (wall === undefined || landing.u0 < 0 || landing.u1 > wall.length) {
    broken.push('landing-on-wall')
  }

  const onDeck = stair.u0 >= landing.u0 && stair.u1 <= landing.u1
  const atDoor = lead !== undefined && stair.u0 <= spanCentre(lead) && spanCentre(lead) <= stair.u1
  if (!onDeck || !atDoor || stair.foot !== landing.depth + stair.steps * stair.tread) {
    broken.push('stair-at-entrance')
  }
  if (stair.u1 - stair.u0 < standards.stairMinWidth) broken.push('stair-wide-enough')
  const reachesGround = Math.abs(stair.riser * (stair.steps + 1) - landing.deckTop) < 1e-6
  if (!reachesGround || stair.riser > standards.stairMaxRiser) broken.push('stair-risers')
  const facesWindow =
    wall !== undefined &&
    lead !== undefined &&
    windowsBeside(wall, lead).some((item) => item.u0 < stair.u1 && stair.u0 < item.u1)
  if (facesWindow) broken.push('stair-clear-of-windows')

  return broken.map((rule) => ({ rule, subject: subjectOf(landing) }))
}

/** Every broken entrance rule of a frame; an empty list means the ways in are sound. */
export function entranceViolations(frame: HouseFrame): EntranceViolation[] {
  const { spec, walls, landings } = frame
  const violations: EntranceViolation[] = []

  for (const { wall, door } of entrancesOf(walls)) {
    const id = door.opening.id
    const onto = landings.filter(
      (landing) =>
        landing.side === wall.side &&
        landing.doors.includes(id) &&
        landing.u0 <= door.u0 &&
        door.u1 <= landing.u1,
    )
    if (onto.length !== 1) violations.push({ rule: 'door-opens-onto-landing', subject: id })
  }

  if (spec.terrace !== null && terraceOf(frame)?.doors[0] !== spec.terrace.entrance) {
    violations.push({ rule: 'terrace-at-its-entrance', subject: spec.terrace.entrance })
  }

  landings.forEach((landing, index) => {
    violations.push(...landingViolations(frame, landing))
    const overlapping = landings
      .slice(index + 1)
      .some(
        (other) => other.side === landing.side && other.u0 < landing.u1 && landing.u0 < other.u1,
      )
    if (overlapping) violations.push({ rule: 'landings-apart', subject: subjectOf(landing) })
  })
  return violations
}

/** Refuses a frame whose entrances break a rule: such a house is not offered or built. */
export function assertEntrances(frame: HouseFrame): HouseFrame {
  const [first] = entranceViolations(frame)
  if (first !== undefined) {
    throw new HouseError(
      'ENTRANCE_INVALID',
      `Entrance rule "${first.rule}" is broken at ${first.subject}`,
      { rule: first.rule, subject: first.subject },
    )
  }
  return frame
}
