import {
  applyChoice,
  choicesOf,
  compatibilityRestrictions,
  houseInputOf,
  initialConfiguration,
  type Configuration,
  type ConfiguratorModel,
  type OptionGroup,
} from '@kedrovnik/configurator'
import {
  HouseError,
  entranceViolations,
  entrancesOf,
  houseModel,
  measureHouse,
  type GroundRect,
  type HouseErrorCode,
  type HouseInput,
  type MeasuredHouse,
  type Vec3,
} from '@kedrovnik/house'
import { describe, expect, it } from 'vitest'

import { quoteHouse } from '@/modules/pricing/application/quote-house'

import { PROJECTS, seedModel } from './support/seed-model'

/** Every option that changes the shape of the house, besides the storey variant (project). */
const SHAPE_GROUPS = [
  'footprint',
  'layout',
  'roof',
  'windows',
  'terrace',
  'insulation',
] as const satisfies readonly OptionGroup[]

/** Every configuration of a series the configurator offers, catalog rules aside. */
function offeredConfigurations(model: ConfiguratorModel): Configuration[] {
  const expand = (configurations: Configuration[], group: OptionGroup) =>
    configurations.flatMap((configuration) =>
      choicesOf(model, configuration, group).map((value) =>
        applyChoice(model, configuration, { group, value }),
      ),
    )
  const starts = model.family.map((member) => initialConfiguration(model, member.slug))
  return SHAPE_GROUPS.reduce(expand, starts)
}

/** Project series: a main project with its storey variants, as the configurator offers them. */
const series = [...new Set(PROJECTS.map((project) => project.variantOf ?? project.slug))].map(
  (root): readonly [string, readonly string[]] => [
    root,
    PROJECTS.filter((project) => (project.variantOf ?? project.slug) === root).map(
      (project) => project.slug,
    ),
  ],
)

const label = (configuration: Configuration) =>
  [
    configuration.project,
    `${configuration.footprint.width}x${configuration.footprint.depth}`,
    configuration.mirrored ? 'mirrored' : 'base',
    configuration.roof,
    configuration.windows,
    `terrace ${configuration.terrace}`,
    `insulation ${configuration.insulation}`,
  ].join(' / ')

/** Errors about the way in: none of them may block an offered combination. */
const ENTRANCE_ERRORS: ReadonlySet<HouseErrorCode> = new Set([
  'ENTRANCE_INVALID',
  'TERRACE_ENTRANCE',
  'TERRACE_OUT_OF_WALL',
])

/**
 * The measured house, or null when the configurator blocks the combination for a reason that
 * is not the entrance (a window that does not fit the wall in that footprint and roof).
 */
function measured(input: HouseInput): MeasuredHouse | null {
  try {
    return measureHouse(input)
  } catch (error) {
    if (error instanceof HouseError && !ENTRANCE_ERRORS.has(error.code)) return null
    throw error
  }
}

/** Midpoint of a rectangle's edge farthest along a horizontal axis direction. */
function farEdgeMidpoint(rect: GroundRect, direction: Vec3): readonly [number, number] {
  const centre = [(rect.min[0] + rect.max[0]) / 2, (rect.min[1] + rect.max[1]) / 2] as const
  if (direction[0] !== 0) return [direction[0] > 0 ? rect.max[0] : rect.min[0], centre[1]]
  return [centre[0], direction[2] > 0 ? rect.max[1] : rect.min[1]]
}

/** Problems of one built house, checked from its frame, mesh anchors and estimate. */
function entranceProblems(house: MeasuredHouse, configuration: Configuration): string[] {
  const { frame, takeoff } = house
  const problems = entranceViolations(frame).map((item) => `${item.rule} at ${item.subject}`)

  // Each exterior door opens onto a deck in front of it, and its steps lead from that deck.
  for (const { wall, door } of entrancesOf(frame.walls)) {
    const landing = frame.landings.find(
      (item) => item.side === wall.side && item.u0 <= door.u0 && door.u1 <= item.u1,
    )
    if (landing === undefined) {
      problems.push(`door ${door.opening.id} opens onto the ground`)
      continue
    }
    const { stair } = landing
    const windowsInFront = wall.openings.filter(
      (item) =>
        item.opening.type === 'window' &&
        item.opening.level === 0 &&
        item.u0 < stair.u1 &&
        stair.u0 < item.u1 &&
        (item.u1 <= door.u0 || item.u0 >= door.u1),
    )
    if (windowsInFront.length > 0) {
      problems.push(`steps of ${door.opening.id} face ${windowsInFront[0]?.opening.id ?? ''}`)
    }
  }

  // The path ends at the foot of the entrance steps.
  const { approach, site } = houseModel(house)
  if (approach !== null) {
    const atSteps = site.landings.some(({ stair }) => {
      const [x, z] = farEdgeMidpoint(stair, approach.direction)
      return Math.abs(x - approach.start[0]) < 1e-6 && Math.abs(z - approach.start[2]) < 1e-6
    })
    if (!atSteps) problems.push('the path does not end at the entrance steps')
  }

  // The estimate measures the decks and steps that are drawn.
  const porch = frame.landings.some((landing) => landing.kind === 'porch')
  if (porch !== takeoff.porchArea > 0) problems.push('porch area does not match the porches')
  if (configuration.terrace === 0 && !porch) problems.push('no porch without the terrace')
  const steps = frame.landings.reduce((sum, landing) => sum + landing.stair.steps, 0)
  if (takeoff.stepCount !== steps || steps === 0) problems.push('steps are not counted')
  return problems
}

describe('entrances across the whole catalog', () => {
  it.each(series)(
    '%s: every offered option combination has a sound way in',
    (_, slugs) => {
      const model = seedModel(...slugs)
      const configurations = offeredConfigurations(model)
      expect(configurations.length).toBeGreaterThan(0)
      let built = 0
      const problems: string[] = []
      for (const configuration of configurations) {
        if (compatibilityRestrictions(model, configuration).length > 0) continue
        const input = houseInputOf(model, configuration)
        const house = measured(input)
        if (house === null) continue
        built += 1
        const quotes = quoteHouse(
          house,
          input.design,
          input.options,
          configuration.engineering,
          model.grid,
        )
        expect(quotes.length).toBeGreaterThan(0)
        problems.push(
          ...entranceProblems(house, configuration).map(
            (problem) => `${label(configuration)}: ${problem}`,
          ),
        )
      }
      expect(built).toBeGreaterThan(0)
      expect(problems).toEqual([])
    },
    120_000,
  )
})
