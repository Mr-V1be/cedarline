import type { HouseOptions } from '@kedrovnik/house'
import type { Selections } from '@kedrovnik/pricing'

/**
 * Options a tariff condition may test. The values are registry keys (roof kinds, finishes,
 * window styles) or catalog data (insulation thickness in mm, engineering system keys).
 */
export const SELECTION_OPTIONS = ['roof', 'facade', 'windows', 'insulation', 'engineering'] as const
export type SelectionOption = (typeof SELECTION_OPTIONS)[number]

export function selectionsOf(options: HouseOptions, engineering: readonly string[]): Selections {
  const selections: Record<SelectionOption, string | readonly string[]> = {
    roof: options.roofKind,
    facade: options.facadeFinish,
    windows: options.windowStyle,
    insulation: String(options.insulation),
    engineering,
  }
  return selections
}
