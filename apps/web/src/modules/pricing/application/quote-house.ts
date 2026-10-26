import { designSelections } from '@cedarline/configurator'
import type { HouseDesign, HouseOptions, MeasuredHouse } from '@cedarline/house'
import { quoteEveryCompleteness, type Quote, type TariffGrid } from '@cedarline/pricing'

/** Quotes of a catalog project as designed, for every completeness level, in grid order. */
export function quoteHouse(
  house: MeasuredHouse,
  design: HouseDesign,
  options: HouseOptions,
  engineering: readonly string[],
  grid: TariffGrid,
): readonly Quote[] {
  return quoteEveryCompleteness(grid, {
    quantities: house.takeoff,
    selections: designSelections(design, options, engineering),
  })
}
