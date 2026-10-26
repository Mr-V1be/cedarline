import type { TariffGrid } from '@cedarline/pricing'

import type { OptionGroup } from './configuration'
import type { SelectionOption } from './selections'

/** The selection option a group is priced by, if any. */
const PRICED_BY: Partial<Readonly<Record<OptionGroup, SelectionOption>>> = {
  project: 'storeys',
  layout: 'layout',
  roof: 'roof',
  facade: 'facade',
  windows: 'windows',
  terrace: 'terrace',
  insulation: 'insulation',
  engineering: 'engineering',
}

/**
 * Completeness levels in which the group's choice changes the estimate, reported only when the
 * selected level is not one of them. Read from the tariff: the sections of the rate lines that
 * test the group's option.
 */
export function completenessCovering(
  grid: TariffGrid,
  group: OptionGroup,
  selected: string,
): readonly string[] {
  const option = PRICED_BY[group]
  if (option === undefined) return []
  const sections = new Set(
    grid.rates
      .filter((rate) => rate.conditions?.some((condition) => condition.option === option))
      .map((rate) => rate.section),
  )
  if (sections.size === 0) return []
  const covering = grid.completeness
    .filter((level) => level.sections.some((section) => sections.has(section)))
    .map((level) => level.key)
  return covering.includes(selected) ? [] : covering
}
