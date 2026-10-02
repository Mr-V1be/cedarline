import { PricingError } from './errors'

declare const kopecksBrand: unique symbol

/** Money in integer kopecks. Never a float: every amount is an exact count of minor units. */
export type Money = number & { readonly [kopecksBrand]: true }

export const KOPECKS_PER_RUBLE = 100

/**
 * Quantities are measured to 1/1000 of a unit (0.001 m², 0.001 pcs). Multiplication is done
 * on integers scaled by this factor so that rounding never depends on float representation.
 */
export const QUANTITY_SCALE = 1000

function assertMoney(value: number): Money {
  if (!Number.isSafeInteger(value)) {
    throw new PricingError('INVALID_MONEY', 'Money must be a safe integer amount of kopecks', {
      value,
    })
  }
  return value as Money
}

export const Money = {
  zero: 0 as Money,

  ofKopecks(kopecks: number): Money {
    return assertMoney(kopecks)
  },

  ofRubles(rubles: number): Money {
    if (!Number.isSafeInteger(rubles)) {
      throw new PricingError('INVALID_MONEY', 'Ruble amounts in the tariff must be integers', {
        rubles,
      })
    }
    return assertMoney(rubles * KOPECKS_PER_RUBLE)
  },

  add(left: Money, right: Money): Money {
    return assertMoney(left + right)
  },

  subtract(left: Money, right: Money): Money {
    return assertMoney(left - right)
  },

  sum(amounts: readonly Money[]): Money {
    return amounts.reduce<Money>((total, amount) => Money.add(total, amount), Money.zero)
  },

  /** Unit price × quantity, rounded half-up to the kopeck. */
  multiply(unitPrice: Money, quantity: number): Money {
    const scaledQuantity = toScaledQuantity(quantity)
    const product = unitPrice * scaledQuantity
    if (!Number.isSafeInteger(product)) {
      throw new PricingError('INVALID_MONEY', 'Amount exceeds the safe integer range', {
        unitPrice,
        quantity,
      })
    }
    const half = QUANTITY_SCALE / 2
    const rounded =
      product >= 0
        ? Math.floor((product + half) / QUANTITY_SCALE)
        : -Math.floor((-product + half) / QUANTITY_SCALE)
    return assertMoney(rounded)
  },

  /** Whole rubles for presentation, rounded half-up. */
  toWholeRubles(amount: Money): number {
    return Math.floor((amount + KOPECKS_PER_RUBLE / 2) / KOPECKS_PER_RUBLE)
  },

  compare(left: Money, right: Money): number {
    return left - right
  },
}

/** Quantity → integer count of 1/QUANTITY_SCALE units, rejecting negative and non-finite input. */
export function toScaledQuantity(quantity: number): number {
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new PricingError('INVALID_QUANTITY', 'Quantity must be a finite non-negative number', {
      quantity,
    })
  }
  return Math.round(quantity * QUANTITY_SCALE)
}

/** Normalises a measured quantity to the precision used in money calculations. */
export function normaliseQuantity(quantity: number): number {
  return toScaledQuantity(quantity) / QUANTITY_SCALE
}
