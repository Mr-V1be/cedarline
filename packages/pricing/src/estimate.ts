import { PricingError } from './errors'
import { Money, normaliseQuantity } from './money'
import { allConditionsHold, type Selections } from './selection'
import type { CompletenessLevel, Quantities, RateLine, TariffGrid } from './tariff'

export interface EstimateLine {
  readonly code: string
  readonly driver: string
  readonly quantity: number
  readonly unitPrice: Money
  readonly amount: Money
}

export interface EstimateSection {
  readonly key: string
  readonly lines: readonly EstimateLine[]
  readonly subtotal: Money
}

export interface Estimate {
  readonly revision: number
  readonly completeness: string
  readonly sections: readonly EstimateSection[]
  readonly total: Money
}

export interface EstimateInput {
  readonly quantities: Quantities
  readonly selections: Selections
  readonly completeness: string
}

export function findCompleteness(grid: TariffGrid, key: string): CompletenessLevel {
  const level = grid.completeness.find((candidate) => candidate.key === key)
  if (level === undefined) {
    throw new PricingError('UNKNOWN_COMPLETENESS', `Unknown completeness level "${key}"`, { key })
  }
  return level
}

export function quantityFor(quantities: Quantities, driver: string, owner: string): number {
  const quantity = quantities[driver]
  if (quantity === undefined) {
    throw new PricingError('MISSING_QUANTITY', `${owner} needs quantity "${driver}"`, {
      driver,
      owner,
    })
  }
  return normaliseQuantity(quantity)
}

function priceLine(rate: RateLine, quantities: Quantities): EstimateLine {
  const quantity = quantityFor(quantities, rate.driver, `rate ${rate.code}`)
  return {
    code: rate.code,
    driver: rate.driver,
    quantity,
    unitPrice: rate.unitPrice,
    amount: Money.multiply(rate.unitPrice, quantity),
  }
}

/**
 * Prices every applicable rate line. Sections keep the grid order; lines with a zero quantity
 * are dropped because they describe work that this house does not have.
 */
export function buildEstimate(grid: TariffGrid, input: EstimateInput): Estimate {
  const level = findCompleteness(grid, input.completeness)
  const inScope = new Set(level.sections)

  const sections = grid.sections
    .filter((section) => inScope.has(section.key))
    .map((section): EstimateSection => {
      const lines = grid.rates
        .filter(
          (rate) =>
            rate.section === section.key && allConditionsHold(rate.conditions, input.selections),
        )
        .map((rate) => priceLine(rate, input.quantities))
        .filter((line) => line.quantity > 0)
      return {
        key: section.key,
        lines,
        subtotal: Money.sum(lines.map((line) => line.amount)),
      }
    })
    .filter((section) => section.lines.length > 0)

  return {
    revision: grid.revision,
    completeness: level.key,
    sections,
    total: Money.sum(sections.map((section) => section.subtotal)),
  }
}
