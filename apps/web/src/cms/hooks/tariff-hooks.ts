import { PricingError } from '@cedarline/pricing'
import { ValidationError, type GlobalBeforeChangeHook } from 'payload'

import { toTariffGrid, type TariffData } from '@/modules/pricing/infrastructure/tariff-mapper'

const ARRAY_OF_KIND: Readonly<Record<string, string>> = {
  section: 'sections',
  rate: 'rates',
  completeness: 'completeness',
  phase: 'phases',
  stage: 'stages',
}

/** Where in the form a grid error belongs, from the kind of the offending entry. */
function errorPath(error: PricingError): string {
  const owner =
    typeof error.details.owner === 'string' ? error.details.owner.split(' ')[0] : undefined
  const kind = typeof error.details.kind === 'string' ? error.details.kind : undefined
  return (
    ARRAY_OF_KIND[owner ?? kind ?? ''] ??
    (error.code === 'EMPTY_COMPLETENESS' ? 'completeness' : 'stages')
  )
}

/** Hook data is untyped; the grid mapper validates its shape. */
const asTariffData = (data: unknown): TariffData => data as TariffData

/** The grid must be consistent as a whole before it is saved. */
export const validateTariff: GlobalBeforeChangeHook = ({ data, req }) => {
  try {
    toTariffGrid(asTariffData(data))
  } catch (error) {
    if (!(error instanceof PricingError)) throw error
    throw new ValidationError({
      global: 'tariff',
      errors: [{ path: errorPath(error), message: error.message }],
      req,
    })
  }
  return data as Record<string, unknown>
}

/** What prices and schedules depend on: everything but names and the revision itself. */
export function tariffSubstance(document: Partial<TariffData>): unknown {
  const withoutIds = (rows: readonly object[] | null | undefined) =>
    (rows ?? []).map((row) =>
      Object.fromEntries(Object.entries(row).filter(([key]) => key !== 'id' && key !== 'name')),
    )
  return {
    workingDaysPerWeek: document.workingDaysPerWeek,
    advertisedRounding: document.advertisedRounding,
    sections: withoutIds(document.sections),
    rates: (document.rates ?? []).map((rate) => ({
      ...rate,
      id: undefined,
      name: undefined,
      conditions: withoutIds(rate.conditions),
    })),
    completeness: withoutIds(document.completeness),
    phases: withoutIds(document.phases),
    stages: (document.stages ?? []).map((stage) => ({
      ...stage,
      id: undefined,
      name: undefined,
      conditions: withoutIds(stage.conditions),
    })),
  }
}

const sameSubstance = (left: Partial<TariffData> | undefined, right: Partial<TariffData>) =>
  left !== undefined &&
  JSON.stringify(tariffSubstance(left)) === JSON.stringify(tariffSubstance(right))

/** A grid that prices differently gets a new revision; renaming and translating do not. */
export const bumpTariffRevision: GlobalBeforeChangeHook = ({ data, originalDoc }) => {
  const original = originalDoc as Partial<TariffData> | undefined
  const incoming = data as Partial<TariffData>
  const previous = original?.revision ?? 0
  return { ...incoming, revision: sameSubstance(original, incoming) ? previous : previous + 1 }
}
