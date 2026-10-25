import { PricingError } from './errors'
import { Money } from './money'

export const ROUNDING_MODES = ['up', 'down', 'nearest'] as const
export type RoundingMode = (typeof ROUNDING_MODES)[number]

/** How an amount is rounded for display: to a multiple of `step`, in a given direction. */
export interface RoundingRule {
  readonly step: Money
  readonly mode: RoundingMode
}

export function validateRoundingRule(rule: RoundingRule): RoundingRule {
  if (!Number.isSafeInteger(rule.step) || rule.step <= 0) {
    throw new PricingError('INVALID_MONEY', 'Rounding step must be a positive amount', {
      step: rule.step,
    })
  }
  if (!(ROUNDING_MODES as readonly string[]).includes(rule.mode)) {
    throw new PricingError('INVALID_NORM', `Unknown rounding mode "${rule.mode}"`, {
      mode: rule.mode,
    })
  }
  return rule
}

/**
 * Rounds a non-negative integer count of minor units to a multiple of `step`. One rule for
 * every amount: tariff money in kopecks and display amounts in any currency's minor units.
 */
export function roundToStep(value: number, step: number, mode: RoundingMode): number {
  const whole = Math.floor(value / step)
  const remainder = value - whole * step
  if (remainder === 0) return value
  const roundUp = mode === 'up' || (mode === 'nearest' && remainder * 2 >= step)
  return (roundUp ? whole + 1 : whole) * step
}

/** Rounds a non-negative amount to a multiple of the rule's step. */
export function roundMoney(amount: Money, rule: RoundingRule): Money {
  return Money.ofKopecks(roundToStep(amount, rule.step, rule.mode))
}
