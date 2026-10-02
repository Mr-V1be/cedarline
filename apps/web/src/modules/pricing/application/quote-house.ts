import { designSelections } from '@kedrovnik/configurator'
import type { HouseDesign, HouseOptions, MeasuredHouse } from '@kedrovnik/house'
import { quoteEveryCompleteness, type Quote, type TariffGrid } from '@kedrovnik/pricing'

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
