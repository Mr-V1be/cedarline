import {
  Money,
  validateTariffGrid,
  type Condition,
  type StageNorm,
  type TariffGrid,
} from '@kedrovnik/pricing'

import type { Tariff as TariffDocument } from '@/cms/generated/payload-types'

import type { TariffNames } from '../ports/tariff-repository'

export type TariffData = Pick<
  TariffDocument,
  | 'revision'
  | 'advertisedRounding'
  | 'sections'
  | 'rates'
  | 'completeness'
  | 'workingDaysPerWeek'
  | 'phases'
  | 'stages'
>

type ConditionRows = NonNullable<NonNullable<TariffDocument['rates']>[number]['conditions']>

const toConditions = (rows: ConditionRows | null | undefined): Condition[] =>
  (rows ?? []).map((row) => ({ option: row.option, anyOf: row.values }))

/** CMS document → validated domain grid. Throws PricingError on any inconsistency. */
export function toTariffGrid(document: TariffData): TariffGrid {
  const stages: StageNorm[] = (document.stages ?? []).map((stage) => ({
    key: stage.key,
    phase: stage.phase,
    ...(stage.section ? { section: stage.section } : {}),
    ...(stage.driver ? { driver: stage.driver } : {}),
    baseDays: stage.baseDays,
    daysPerUnit: stage.daysPerUnit,
    dependsOn: stage.dependsOn ?? [],
    conditions: toConditions(stage.conditions),
  }))
  return validateTariffGrid({
    revision: document.revision ?? 0,
    advertisedRounding: {
      step: Money.ofRubles(document.advertisedRounding.step),
      mode: document.advertisedRounding.mode,
    },
    sections: (document.sections ?? []).map((section) => ({ key: section.key })),
    rates: (document.rates ?? []).map((rate) => ({
      code: rate.code,
      section: rate.section,
      driver: rate.driver,
      unitPrice: Money.ofRubles(rate.unitPrice),
      conditions: toConditions(rate.conditions),
    })),
    completeness: (document.completeness ?? []).map((level) => ({
      key: level.key,
      sections: level.sections,
    })),
    schedule: {
      workingDaysPerWeek: document.workingDaysPerWeek,
      phases: (document.phases ?? []).map((phase) => ({ key: phase.key })),
      stages,
    },
  })
}

const namesBy = <T extends { name: string }>(
  rows: readonly T[] | null | undefined,
  keyOf: (row: T) => string,
) => Object.fromEntries((rows ?? []).map((row) => [keyOf(row), row.name]))

export function toTariffNames(document: TariffDocument): TariffNames {
  return {
    sections: namesBy(document.sections, (row) => row.key),
    completeness: namesBy(document.completeness, (row) => row.key),
    phases: namesBy(document.phases, (row) => row.key),
    stages: namesBy(document.stages, (row) => row.key),
    rates: namesBy(document.rates, (row) => row.code),
  }
}
