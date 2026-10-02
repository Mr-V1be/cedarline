import type { HouseOptions, MeasuredHouse } from '@kedrovnik/house'
import { quoteEveryCompleteness, type Quote, type TariffGrid } from '@kedrovnik/pricing'

import { selectionsOf } from '../domain/selections'

/** Quotes of a measured house for every completeness level, in grid order. */
export function quoteHouse(
  house: MeasuredHouse,
  options: HouseOptions,
  engineering: readonly string[],
  grid: TariffGrid,
): readonly Quote[] {
  return quoteEveryCompleteness(grid, {
    quantities: house.takeoff,
    selections: selectionsOf(options, engineering),
  })
}
