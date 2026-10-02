import { PricingError } from './errors'
import type { StageNorm, TariffGrid } from './tariff'

const MAX_WORKING_DAYS_PER_WEEK = 7

function assertUniqueKeys(kind: string, keys: readonly string[]): ReadonlySet<string> {
  const seen = new Set<string>()
  for (const key of keys) {
    if (seen.has(key)) {
      throw new PricingError('DUPLICATE_KEY', `Duplicate ${kind} key "${key}"`, { kind, key })
    }
    seen.add(key)
  }
  return seen
}

function assertReference(kind: string, key: string, known: ReadonlySet<string>, owner: string) {
  if (!known.has(key)) {
    throw new PricingError('UNKNOWN_REFERENCE', `${owner} references unknown ${kind} "${key}"`, {
      kind,
      key,
      owner,
    })
  }
}

function assertNonNegativeNumber(value: number, field: string, owner: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new PricingError('INVALID_NORM', `${owner}.${field} must be a non-negative number`, {
      owner,
      field,
      value,
    })
  }
}

function assertAcyclic(stages: readonly StageNorm[]) {
  const byKey = new Map(stages.map((stage) => [stage.key, stage]))
  const state = new Map<string, 'visiting' | 'done'>()

  const visit = (key: string, path: readonly string[]) => {
    const current = state.get(key)
    if (current === 'done') return
    if (current === 'visiting') {
      throw new PricingError('DEPENDENCY_CYCLE', 'Stage dependencies form a cycle', {
        cycle: [...path, key],
      })
    }
    state.set(key, 'visiting')
    for (const dependency of byKey.get(key)?.dependsOn ?? []) visit(dependency, [...path, key])
    state.set(key, 'done')
  }

  for (const stage of stages) visit(stage.key, [])
}

/**
 * Checks every invariant of a tariff grid. Grids come from the CMS, so they are validated once
 * at the boundary and the calculation code can rely on consistent references.
 */
export function validateTariffGrid(grid: TariffGrid): TariffGrid {
  const sections = assertUniqueKeys(
    'section',
    grid.sections.map((section) => section.key),
  )
  assertUniqueKeys(
    'rate',
    grid.rates.map((rate) => rate.code),
  )
  for (const rate of grid.rates) {
    assertReference('section', rate.section, sections, `rate ${rate.code}`)
    if (!Number.isSafeInteger(rate.unitPrice) || rate.unitPrice < 0) {
      throw new PricingError('INVALID_MONEY', `rate ${rate.code} has an invalid unit price`, {
        code: rate.code,
      })
    }
  }

  if (grid.completeness.length === 0) {
    throw new PricingError('EMPTY_COMPLETENESS', 'Tariff grid defines no completeness levels')
  }
  assertUniqueKeys(
    'completeness',
    grid.completeness.map((level) => level.key),
  )
  for (const level of grid.completeness) {
    for (const section of level.sections) {
      assertReference('section', section, sections, `completeness ${level.key}`)
    }
  }

  const { schedule } = grid
  if (
    !Number.isInteger(schedule.workingDaysPerWeek) ||
    schedule.workingDaysPerWeek < 1 ||
    schedule.workingDaysPerWeek > MAX_WORKING_DAYS_PER_WEEK
  ) {
    throw new PricingError('INVALID_NORM', 'workingDaysPerWeek must be an integer from 1 to 7', {
      value: schedule.workingDaysPerWeek,
    })
  }
  const phases = assertUniqueKeys(
    'phase',
    schedule.phases.map((phase) => phase.key),
  )
  const stages = assertUniqueKeys(
    'stage',
    schedule.stages.map((stage) => stage.key),
  )
  for (const stage of schedule.stages) {
    const owner = `stage ${stage.key}`
    assertReference('phase', stage.phase, phases, owner)
    if (stage.section !== undefined) assertReference('section', stage.section, sections, owner)
    for (const dependency of stage.dependsOn) assertReference('stage', dependency, stages, owner)
    assertNonNegativeNumber(stage.baseDays, 'baseDays', owner)
    assertNonNegativeNumber(stage.daysPerUnit, 'daysPerUnit', owner)
  }
  assertAcyclic(schedule.stages)

  return grid
}
