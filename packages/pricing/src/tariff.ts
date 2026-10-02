import type { Money } from './money'
import type { Condition } from './selection'

/** Estimate section (статья сметы). Keys and order are tariff data, labels live in the CMS. */
export interface SectionDefinition {
  readonly key: string
}

/** One priced line: unit price applied to a quantity driver when all conditions hold. */
export interface RateLine {
  readonly code: string
  readonly section: string
  /** Quantity driver key produced by the takeoff (area, count, perimeter, lump sum). */
  readonly driver: string
  readonly unitPrice: Money
  readonly conditions?: readonly Condition[]
}

/** Completeness level (комплектация): which estimate sections are in scope. */
export interface CompletenessLevel {
  readonly key: string
  readonly sections: readonly string[]
}

export interface PhaseDefinition {
  readonly key: string
}

/** Duration norm of a construction stage: baseDays + quantity × daysPerUnit, in working days. */
export interface StageNorm {
  readonly key: string
  readonly phase: string
  /** Stage is performed only when this section is in the selected completeness. */
  readonly section?: string
  readonly driver?: string
  readonly baseDays: number
  readonly daysPerUnit: number
  readonly dependsOn: readonly string[]
  readonly conditions?: readonly Condition[]
}

export interface ScheduleNorms {
  readonly workingDaysPerWeek: number
  readonly phases: readonly PhaseDefinition[]
  readonly stages: readonly StageNorm[]
}

/** The whole tariff grid. `revision` changes on every edit and keys caches and projections. */
export interface TariffGrid {
  readonly revision: number
  readonly sections: readonly SectionDefinition[]
  readonly rates: readonly RateLine[]
  readonly completeness: readonly CompletenessLevel[]
  readonly schedule: ScheduleNorms
}

/** Quantities measured for one house, keyed by driver. */
export type Quantities = Readonly<Record<string, number>>
