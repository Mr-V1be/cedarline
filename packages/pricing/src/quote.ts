import { buildEstimate, type Estimate } from './estimate'
import { Money } from './money'
import { roundMoney } from './rounding'
import { planSchedule, type Schedule } from './schedule'
import type { Selections } from './selection'
import type { Quantities, TariffGrid } from './tariff'

export interface QuoteInput {
  readonly quantities: Quantities
  readonly selections: Selections
  readonly completeness: string
}

export interface Quote {
  readonly estimate: Estimate
  readonly schedule: Schedule
}

/** Estimate and schedule for one configuration: the single entry point used by the application. */
export function quote(grid: TariffGrid, input: QuoteInput): Quote {
  return { estimate: buildEstimate(grid, input), schedule: planSchedule(grid, input) }
}

/** One quote per completeness level, in grid order (комплектации на странице проекта). */
export function quoteEveryCompleteness(
  grid: TariffGrid,
  input: Omit<QuoteInput, 'completeness'>,
): readonly Quote[] {
  return grid.completeness.map((level) => quote(grid, { ...input, completeness: level.key }))
}

/** The lowest total among completeness levels — the quote behind the catalog's «цена от». */
export function lowestQuote(quotes: readonly Quote[]): Quote | undefined {
  return quotes.reduce<Quote | undefined>(
    (lowest, candidate) =>
      lowest === undefined || Money.compare(candidate.estimate.total, lowest.estimate.total) < 0
        ? candidate
        : lowest,
    undefined,
  )
}

/**
 * The advertised «price from»: the cheapest quote rounded by the grid's display rule.
 * Rounding up keeps the advertised figure at or above every price a customer can be quoted.
 */
export function advertisedPrice(grid: TariffGrid, quotes: readonly Quote[]): Money | undefined {
  const lowest = lowestQuote(quotes)
  return lowest === undefined
    ? undefined
    : roundMoney(lowest.estimate.total, grid.advertisedRounding)
}
