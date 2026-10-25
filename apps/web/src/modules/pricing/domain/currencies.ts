import type { RoundingMode } from '@kedrovnik/pricing'

import type { Locale } from '@/i18n/locales'

/**
 * What an amount on screen is. The kind decides how it is rounded in a display currency:
 * the same ruble figure is shown to the dollar in an estimate and to $100 as a «from» price.
 */
export const AMOUNT_KINDS = ['exact', 'from', 'delta', 'unitPrice'] as const
export type AmountKind = (typeof AMOUNT_KINDS)[number]

/** A display rounding rule in the currency's minor units (cents, kopecks). */
export interface DisplayRounding {
  readonly step: number
  readonly mode: RoundingMode
}

/** A currency of the registry; its key is the ISO 4217 code (Intl, structured data, the CRM). */
export interface CurrencyDefinition {
  /** BCP 47 tag the currency is written in («$62,000», «5 117 161 ₽»), whatever the page. */
  readonly intlLocale: string
  /** ISO 4217 exponent: minor units per major unit is 10 to this power. */
  readonly minorDigits: number
  /**
   * Rounding per amount kind:
   * - `exact` — totals, subtotals, line amounts and payments;
   * - `from` — the advertised «price from»: rounded up, so no quote is below it;
   * - `delta` — what an option adds to the total or takes from it;
   * - `unitPrice` — the rate of an estimate line, precise enough that quantity × rate reads
   *   as the line amount.
   */
  readonly rounding: Readonly<Record<AmountKind, DisplayRounding>>
  /** A round step for budget thresholds people pick from, in minor units. */
  readonly thresholdStep: number
}

const WHOLE_KOPECKS = 100
const WHOLE_CENTS = 100

/**
 * Currencies prices can be shown in. A new currency is an entry here (and a rate in the CMS
 * global «Exchange rates»); nothing else changes.
 */
export const CURRENCIES = {
  RUB: {
    intlLocale: 'ru-RU',
    minorDigits: 2,
    rounding: {
      exact: { step: WHOLE_KOPECKS, mode: 'nearest' },
      // The ruble «from» figure is already rounded by the tariff's own rule (1 000 ₽ up).
      from: { step: WHOLE_KOPECKS, mode: 'up' },
      delta: { step: WHOLE_KOPECKS, mode: 'nearest' },
      unitPrice: { step: WHOLE_KOPECKS, mode: 'nearest' },
    },
    thresholdStep: 1_000_000 * WHOLE_KOPECKS,
  },
  USD: {
    intlLocale: 'en-US',
    minorDigits: 2,
    rounding: {
      exact: { step: WHOLE_CENTS, mode: 'nearest' },
      from: { step: 100 * WHOLE_CENTS, mode: 'up' },
      delta: { step: WHOLE_CENTS, mode: 'nearest' },
      unitPrice: { step: 1, mode: 'nearest' },
    },
    thresholdStep: 10_000 * WHOLE_CENTS,
  },
} as const satisfies Record<string, CurrencyDefinition>

export type CurrencyCode = keyof typeof CURRENCIES
export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[]

export const isCurrencyCode = (value: string): value is CurrencyCode =>
  (CURRENCY_CODES as readonly string[]).includes(value)

/** The currency of the tariff: every stored amount is in it, other currencies are converted. */
export const BASE_CURRENCY: CurrencyCode = 'RUB'

/** Currencies that need an exchange rate to be shown. */
export const CONVERTED_CURRENCIES = CURRENCY_CODES.filter((code) => code !== BASE_CURRENCY)

/** The currency each language of the site shows prices in. */
export const DISPLAY_CURRENCIES: Readonly<Record<Locale, CurrencyCode>> = {
  ru: 'RUB',
  en: 'USD',
}

export const currencyOf = (code: CurrencyCode): CurrencyDefinition => CURRENCIES[code]

/** Minor units in one major unit of a currency: 100 for both the ruble and the dollar. */
export const minorPerMajor = (code: CurrencyCode): number => 10 ** CURRENCIES[code].minorDigits
