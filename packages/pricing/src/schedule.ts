import { findCompleteness, quantityFor } from './estimate'
import { allConditionsHold, type Selections } from './selection'
import type { Quantities, StageNorm, TariffGrid } from './tariff'

export interface ScheduledStage {
  readonly key: string
  readonly phase: string
  /** Working day offsets from the start of the project; endDay is exclusive. */
  readonly startDay: number
  readonly endDay: number
  readonly durationDays: number
}

export interface PhaseSpan {
  readonly key: string
  readonly startDay: number
  readonly endDay: number
  readonly durationDays: number
}

export interface Schedule {
  readonly workingDaysPerWeek: number
  readonly stages: readonly ScheduledStage[]
  readonly phases: readonly PhaseSpan[]
  readonly totalDays: number
  readonly totalWeeks: number
}

export interface ScheduleInput {
  readonly quantities: Quantities
  readonly selections: Selections
  readonly completeness: string
}

/** Norms are entered with decimals (0.04 days per m²); this precision strips float noise before ceil. */
const DURATION_PRECISION = 1_000_000

function stageDuration(stage: StageNorm, input: ScheduleInput, inScope: ReadonlySet<string>) {
  const sectionInScope = stage.section === undefined || inScope.has(stage.section)
  if (!sectionInScope || !allConditionsHold(stage.conditions, input.selections)) return 0

  const quantity =
    stage.driver === undefined
      ? 0
      : quantityFor(input.quantities, stage.driver, `stage ${stage.key}`)
  // A stage tied to a quantity that this house does not have (no terrace) is not performed.
  if (stage.driver !== undefined && quantity === 0) return 0

  const raw = stage.baseDays + quantity * stage.daysPerUnit
  return Math.ceil(Math.round(raw * DURATION_PRECISION) / DURATION_PRECISION)
}

/**
 * Critical-path schedule: every stage starts when all of its dependencies have finished.
 * Stages that are not performed keep a zero duration so that dependency chains stay intact.
 */
export function planSchedule(grid: TariffGrid, input: ScheduleInput): Schedule {
  const level = findCompleteness(grid, input.completeness)
  const inScope = new Set(level.sections)
  const { stages, phases, workingDaysPerWeek } = grid.schedule
  const byKey = new Map(stages.map((stage) => [stage.key, stage]))
  const finished = new Map<string, { start: number; end: number; duration: number }>()

  const resolve = (key: string): number => {
    const known = finished.get(key)
    if (known !== undefined) return known.end
    const stage = byKey.get(key)
    if (stage === undefined) return 0
    const start = Math.max(0, ...stage.dependsOn.map(resolve))
    const duration = stageDuration(stage, input, inScope)
    finished.set(key, { start, end: start + duration, duration })
    return start + duration
  }
  stages.forEach((stage) => resolve(stage.key))

  const scheduled: ScheduledStage[] = stages
    .flatMap((stage) => {
      const timing = finished.get(stage.key)
      if (timing === undefined || timing.duration === 0) return []
      return [
        {
          key: stage.key,
          phase: stage.phase,
          startDay: timing.start,
          endDay: timing.end,
          durationDays: timing.duration,
        },
      ]
    })
    .sort((left, right) => left.startDay - right.startDay)

  const phaseSpans: PhaseSpan[] = phases.flatMap((phase) => {
    const inPhase = scheduled.filter((stage) => stage.phase === phase.key)
    if (inPhase.length === 0) return []
    const startDay = Math.min(...inPhase.map((stage) => stage.startDay))
    const endDay = Math.max(...inPhase.map((stage) => stage.endDay))
    return [{ key: phase.key, startDay, endDay, durationDays: endDay - startDay }]
  })

  const totalDays = Math.max(0, ...scheduled.map((stage) => stage.endDay))
  return {
    workingDaysPerWeek,
    stages: scheduled,
    phases: phaseSpans,
    totalDays,
    totalWeeks: Math.ceil(totalDays / workingDaysPerWeek),
  }
}
