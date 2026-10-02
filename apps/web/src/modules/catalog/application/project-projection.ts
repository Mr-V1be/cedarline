import { measureHouse, type HouseDesign, type HouseOptions } from '@kedrovnik/house'
import { Money, advertisedPrice, lowestQuote, type TariffGrid } from '@kedrovnik/pricing'

import { quoteHouse } from '@/modules/pricing/application/quote-house'

import type { ProjectMetrics, ProjectPricing } from '../domain/project'
import { storeyTypeOf } from '../domain/project'
import type { HouseContext } from '../ports/house-context-repository'

export interface ProjectionInput {
  readonly design: HouseDesign
  readonly options: HouseOptions
  readonly engineering: readonly string[]
}

export interface ProjectProjection {
  readonly metrics: ProjectMetrics
  readonly pricing: ProjectPricing
}

/**
 * Catalog projection of a project: characteristics measured from the design and the advertised
 * «price from» (the cheapest completeness, rounded by the tariff's display rule). Recomputed whenever the project, the tariff or the
 * catalog data it depends on changes, in the same transaction.
 */
export function projectProject(
  input: ProjectionInput,
  context: Pick<HouseContext, 'rooms' | 'standards'>,
  grid: TariffGrid,
): ProjectProjection {
  const house = measureHouse({
    design: input.design,
    options: input.options,
    rooms: context.rooms,
    standards: context.standards,
  })
  const quotes = quoteHouse(house, input.design, input.options, input.engineering, grid)
  const lowest = lowestQuote(quotes)
  const advertised = advertisedPrice(grid, quotes)
  if (lowest === undefined || advertised === undefined)
    throw new Error('Tariff grid has no completeness levels')
  const { metrics } = house
  return {
    metrics: { ...metrics, storeyType: storeyTypeOf(metrics.storeys, metrics.attic) },
    pricing: {
      fromPrice: Money.toWholeRubles(advertised),
      fromCompleteness: lowest.estimate.completeness,
      totalWeeks: lowest.schedule.totalWeeks,
      tariffRevision: grid.revision,
    },
  }
}
