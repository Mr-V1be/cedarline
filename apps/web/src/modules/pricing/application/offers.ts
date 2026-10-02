import { Money, type Quote, type Schedule } from '@kedrovnik/pricing'

import type { TariffNames } from '../ports/tariff-repository'

export interface ScheduleStageView {
  readonly key: string
  readonly name: string
  readonly phase: string
  /** 1-based calendar weeks the stage touches. */
  readonly fromWeek: number
  readonly toWeek: number
}

export interface ScheduleView {
  readonly totalWeeks: number
  readonly phases: ReadonlyArray<{ readonly key: string; readonly name: string }>
  readonly stages: readonly ScheduleStageView[]
}

/** Working days → the weeks a stage occupies, for a week-based chart. */
export function toScheduleView(schedule: Schedule, names: TariffNames): ScheduleView {
  const perWeek = schedule.workingDaysPerWeek
  return {
    totalWeeks: schedule.totalWeeks,
    phases: schedule.phases.map((phase) => ({
      key: phase.key,
      name: names.phases[phase.key] ?? phase.key,
    })),
    stages: schedule.stages.map((stage) => {
      const fromWeek = Math.floor(stage.startDay / perWeek) + 1
      return {
        key: stage.key,
        name: names.stages[stage.key] ?? stage.key,
        phase: stage.phase,
        fromWeek,
        toWeek: Math.max(fromWeek, Math.ceil(stage.endDay / perWeek)),
      }
    }),
  }
}

/** A completeness level as offered to the customer: price, schedule and what is included. */
export interface CompletenessOffer {
  readonly key: string
  readonly name: string
  /** Whole rubles. */
  readonly total: number
  readonly schedule: ScheduleView
  readonly sections: ReadonlyArray<{
    readonly key: string
    readonly name: string
    readonly subtotal: number
  }>
}

export function toOffer(quote: Quote, names: TariffNames): CompletenessOffer {
  const { estimate, schedule } = quote
  return {
    key: estimate.completeness,
    name: names.completeness[estimate.completeness] ?? estimate.completeness,
    total: Money.toWholeRubles(estimate.total),
    schedule: toScheduleView(schedule, names),
    sections: estimate.sections.map((section) => ({
      key: section.key,
      name: names.sections[section.key] ?? section.key,
      subtotal: Money.toWholeRubles(section.subtotal),
    })),
  }
}
