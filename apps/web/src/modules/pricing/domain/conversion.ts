import { Money, roundToStep } from '@cedarline/pricing'

import {
  BASE_CURRENCY,
  CURRENCIES,
  minorPerMajor,
  type AmountKind,
  type CurrencyCode,
} from './currencies'
import { CurrencyError, RATE_SCALE, scaledRate, type DisplayCurrency } from './exchange-rate'

/** a × b / c rounded half away from zero, on big integers: no float ever touches money. */
function mulDiv(a: number, b: bigint, c: bigint): number {
  const numerator = BigInt(Math.abs(a)) * b
  const quotient = (2n * numerator + c) / (2n * c)
  const result = Number(quotient)
  return a < 0 && result !== 0 ? -result : result
}

/** Minor units of the display currency per kopeck, as the fraction numerator / denominator. */
function ratio(display: DisplayCurrency): { numerator: bigint; denominator: bigint } {
  const converted = display.currency !== BASE_CURRENCY
  if (
    converted !== (display.rate !== null) ||
    (display.rate?.currency ?? display.currency) !== display.currency
  ) {
    throw new CurrencyError(
      'INVALID_RATE',
      `No consistent rate to show prices in ${display.currency}`,
      {
        currency: display.currency,
        rate: display.rate,
      },
    )
  }
  const base = BigInt(minorPerMajor(BASE_CURRENCY))
  if (display.rate === null) return { numerator: base, denominator: base }
  return {
    numerator: BigInt(minorPerMajor(display.currency)) * BigInt(RATE_SCALE),
    denominator: base * BigInt(scaledRate(display.rate)),
  }
}

/**
 * A tariff amount in the display currency, rounded for its kind, in that currency's minor
 * units. The only place rubles become another currency: every price on every surface goes
 * through it. Conversion starts from the whole-ruble figure the Russian site shows, so a sum
 * stored in whole rubles (a lead, the catalog's «from» price) converts to exactly what the
 * visitor saw. Negative amounts (an option that lowers the total) round like positive ones.
 */
export function toDisplayMinor(amount: Money, display: DisplayCurrency, kind: AmountKind): number {
  const { numerator, denominator } = ratio(display)
  const wholeBase = roundToStep(Math.abs(amount), minorPerMajor(BASE_CURRENCY), 'nearest')
  const rule = CURRENCIES[display.currency].rounding[kind]
  const magnitude = roundToStep(mulDiv(wholeBase, numerator, denominator), rule.step, rule.mode)
  return amount < 0 && magnitude !== 0 ? -magnitude : magnitude
}

/** A figure in the display currency's minor units as tariff money: a typed price or budget. */
export function toBaseMoney(minor: number, display: DisplayCurrency): Money {
  const { numerator, denominator } = ratio(display)
  return Money.ofKopecks(mulDiv(minor, denominator, numerator))
}

export const toMajor = (minor: number, currency: CurrencyCode): number =>
  minor / minorPerMajor(currency)

export const toMinor = (major: number, currency: CurrencyCode): number =>
  Math.round(major * minorPerMajor(currency))

/** Decimals an amount of this kind is written with: none when it is rounded to whole units. */
export function fractionDigitsOf(currency: CurrencyCode, kind: AmountKind): number {
  const definition = CURRENCIES[currency]
  return definition.rounding[kind].step % minorPerMajor(currency) === 0 ? 0 : definition.minorDigits
}
