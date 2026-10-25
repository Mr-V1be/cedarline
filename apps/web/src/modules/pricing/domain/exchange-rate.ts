import type { Locale } from '@/i18n/locales'

import {
  BASE_CURRENCY,
  CONVERTED_CURRENCIES,
  DISPLAY_CURRENCIES,
  isCurrencyCode,
  type CurrencyCode,
} from './currencies'

/** Rates are kept to 1/10 000 of a ruble, the precision the Bank of Russia publishes. */
export const RATE_DECIMALS = 4
export const RATE_SCALE = 10 ** RATE_DECIMALS

/** How many rubles one unit of a currency costs, and when staff set that figure. */
export interface ExchangeRate {
  readonly currency: CurrencyCode
  /** Rubles per one unit of the currency, e.g. 85.25; at most four decimals. */
  readonly rate: number
  /** ISO 8601 instant the rate was set. */
  readonly setOn: string
}

export type ExchangeRates = readonly ExchangeRate[]

/**
 * What a visitor sees prices in: the currency and the rate that converts the tariff's rubles
 * into it. The ruble itself needs no rate. A lead keeps exactly this, so the manager sees the
 * figures the customer saw.
 */
export interface DisplayCurrency {
  readonly currency: CurrencyCode
  readonly rate: ExchangeRate | null
}

export const BASE_DISPLAY: DisplayCurrency = { currency: BASE_CURRENCY, rate: null }

export type CurrencyErrorCode = 'INVALID_RATE' | 'DUPLICATE_RATE' | 'UNKNOWN_CURRENCY'

export class CurrencyError extends Error {
  constructor(
    readonly code: CurrencyErrorCode,
    message: string,
    readonly details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message)
    this.name = 'CurrencyError'
  }
}

/** The rate as an integer count of 1/RATE_SCALE rubles: conversions never touch a float rate. */
export const scaledRate = (rate: ExchangeRate): number => Math.round(rate.rate * RATE_SCALE)

const hasRatePrecision = (rate: number) =>
  Math.abs(rate * RATE_SCALE - Math.round(rate * RATE_SCALE)) < 1e-6

/** Every rate is of a converted currency, given once, positive, to four decimals and dated. */
export function validateExchangeRates(rates: ExchangeRates): ExchangeRates {
  const seen = new Set<CurrencyCode>()
  for (const entry of rates) {
    if (!(CONVERTED_CURRENCIES as readonly string[]).includes(entry.currency)) {
      throw new CurrencyError(
        'UNKNOWN_CURRENCY',
        `${entry.currency} is not a currency prices are converted into`,
        { currency: entry.currency },
      )
    }
    if (seen.has(entry.currency)) {
      throw new CurrencyError('DUPLICATE_RATE', `${entry.currency} has more than one rate`, {
        currency: entry.currency,
      })
    }
    seen.add(entry.currency)
    if (!Number.isFinite(entry.rate) || entry.rate <= 0 || !hasRatePrecision(entry.rate)) {
      throw new CurrencyError(
        'INVALID_RATE',
        `The ${entry.currency} rate must be a positive number with at most ${RATE_DECIMALS} decimals`,
        { currency: entry.currency, rate: entry.rate },
      )
    }
    if (Number.isNaN(Date.parse(entry.setOn))) {
      throw new CurrencyError('INVALID_RATE', `The ${entry.currency} rate has no valid date`, {
        currency: entry.currency,
        setOn: entry.setOn,
      })
    }
  }
  return rates
}

export const rateFor = (rates: ExchangeRates, currency: CurrencyCode): ExchangeRate | null =>
  rates.find((entry) => entry.currency === currency) ?? null

/** Currencies a language of the site shows prices in that have no rate to convert into. */
export const missingDisplayRates = (rates: ExchangeRates): CurrencyCode[] =>
  [...new Set(Object.values(DISPLAY_CURRENCIES))].filter(
    (currency) => currency !== BASE_CURRENCY && rateFor(rates, currency) === null,
  )

/**
 * The display currency of a language at the given rates. A currency without a rate cannot be
 * shown, so the language falls back to the tariff's own currency rather than to a wrong figure.
 */
export function displayCurrencyFor(locale: Locale, rates: ExchangeRates): DisplayCurrency {
  const currency = DISPLAY_CURRENCIES[locale]
  if (currency === BASE_CURRENCY) return BASE_DISPLAY
  const rate = rateFor(rates, currency)
  return rate === null ? BASE_DISPLAY : { currency, rate }
}

/** A display currency kept as plain fields, as a lead stores it. */
export interface StoredDisplayCurrency {
  readonly currency: string
  readonly rate?: number | null
  readonly rateSetOn?: string | null
}

export const storeDisplayCurrency = (
  display: DisplayCurrency,
): StoredDisplayCurrency & { readonly currency: CurrencyCode } => ({
  currency: display.currency,
  rate: display.rate?.rate ?? null,
  rateSetOn: display.rate?.setOn ?? null,
})

/** The stored fields back as a display currency; null when they do not make one. */
export function restoreDisplayCurrency(stored: StoredDisplayCurrency): DisplayCurrency | null {
  if (!isCurrencyCode(stored.currency)) return null
  if (stored.currency === BASE_CURRENCY) return BASE_DISPLAY
  if (typeof stored.rate !== 'number' || typeof stored.rateSetOn !== 'string') return null
  const rate: ExchangeRate = {
    currency: stored.currency,
    rate: stored.rate,
    setOn: stored.rateSetOn,
  }
  try {
    validateExchangeRates([rate])
  } catch (error) {
    if (error instanceof CurrencyError) return null
    throw error
  }
  return { currency: stored.currency, rate }
}
