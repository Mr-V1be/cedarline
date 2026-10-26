import type { Money } from '@cedarline/pricing'

import {
  fractionDigitsOf,
  toBaseMoney,
  toDisplayMinor,
  toMajor,
  toMinor,
} from '../domain/conversion'
import { BASE_CURRENCY, CURRENCIES, type AmountKind, type CurrencyCode } from '../domain/currencies'
import { RATE_DECIMALS, type DisplayCurrency, type ExchangeRate } from '../domain/exchange-rate'

/**
 * Prices as one visitor reads them. Every surface — pages, the configurator, the PDF, letters,
 * structured data and the CMS — writes money through this, so the same ruble figure reads the
 * same everywhere.
 */
export interface PriceFormatter {
  readonly display: DisplayCurrency
  /** The sign written next to amounts: «₽», «$». */
  readonly symbol: string
  /** A round step for budget thresholds, in whole display units: 1 000 000 ₽, $10,000. */
  readonly thresholdStep: number
  /** A tariff amount converted and rounded for its kind, in whole display units: 62000, 92.94. */
  value(amount: Money, kind: AmountKind): number
  /** A tariff amount converted, rounded and written: «$62,000», «5 117 161 ₽». */
  format(amount: Money, kind: AmountKind): string
  /** A figure already in the display currency, written as money: «$60,000». */
  formatValue(value: number): string
  /** The short form of such a figure, for thresholds: «$60K», «5 млн ₽». */
  compact(value: number): string
  /** A figure in the display currency as tariff money: what a typed price or budget means. */
  toBase(value: number): Money
}

type NumberFormatKey = `${CurrencyCode}:${number}:${'standard' | 'compact'}`
const numberFormats = new Map<NumberFormatKey, Intl.NumberFormat>()

/** Formats are immutable and costly to build, so each is built once per process. */
function numberFormat(
  currency: CurrencyCode,
  digits: number,
  notation: 'standard' | 'compact',
): Intl.NumberFormat {
  const key: NumberFormatKey = `${currency}:${digits}:${notation}`
  let format = numberFormats.get(key)
  if (format === undefined) {
    format = new Intl.NumberFormat(CURRENCIES[currency].intlLocale, {
      style: 'currency',
      currency,
      notation,
      minimumFractionDigits: notation === 'compact' ? 0 : digits,
      maximumFractionDigits: notation === 'compact' ? 1 : digits,
    })
    numberFormats.set(key, format)
  }
  return format
}

export function createPriceFormatter(display: DisplayCurrency): PriceFormatter {
  const { currency } = display
  const value = (amount: Money, kind: AmountKind) =>
    toMajor(toDisplayMinor(amount, display, kind), currency)
  const symbol =
    numberFormat(currency, 0, 'standard')
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value ?? currency
  return {
    display,
    symbol,
    thresholdStep: toMajor(CURRENCIES[currency].thresholdStep, currency),
    value,
    format: (amount, kind) =>
      numberFormat(currency, fractionDigitsOf(currency, kind), 'standard').format(
        value(amount, kind),
      ),
    formatValue: (figure) =>
      numberFormat(
        currency,
        Number.isInteger(figure) ? 0 : CURRENCIES[currency].minorDigits,
        'standard',
      ).format(figure),
    compact: (figure) => numberFormat(currency, 0, 'compact').format(figure),
    toBase: (figure) => toBaseMoney(toMinor(figure, currency), display),
  }
}

/** The rate as staff set it, in rubles with up to four decimals: «85,25 ₽». */
export const formatExchangeRate = (rate: ExchangeRate): string =>
  new Intl.NumberFormat(CURRENCIES[BASE_CURRENCY].intlLocale, {
    style: 'currency',
    currency: BASE_CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: RATE_DECIMALS,
  }).format(rate.rate)
