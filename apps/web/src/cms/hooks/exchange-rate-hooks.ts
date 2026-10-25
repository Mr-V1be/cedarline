import { ValidationError, type GlobalBeforeChangeHook } from 'payload'

import { missingDisplayRates, CurrencyError } from '@/modules/pricing/domain/exchange-rate'
import {
  toExchangeRates,
  type StoredExchangeRate,
} from '@/modules/pricing/infrastructure/exchange-rate-mapper'

interface RatesData {
  readonly rates?: ReadonlyArray<StoredExchangeRate & { readonly id?: string | null }> | null
}

/** Hook data is untyped; the rates mapper validates its shape. */
const asRatesData = (data: unknown): RatesData => data as RatesData

/**
 * The date of a rate is the day it was set, and the code sets it: a changed (or new) rate is
 * stamped now. A date that differs from the stored one is an explicit choice of the caller
 * (the seed) and is kept; staff only see it.
 */
export const stampRateDates: GlobalBeforeChangeHook = ({ data, originalDoc }) => {
  const previous = asRatesData(originalDoc).rates ?? []
  const now = new Date().toISOString()
  const dateOf = (row: StoredExchangeRate): string => {
    const before = previous.find((candidate) => candidate.currency === row.currency)
    if (typeof row.setOn === 'string' && row.setOn !== before?.setOn) return row.setOn
    if (before === undefined || before.rate !== row.rate) return now
    return before.setOn ?? now
  }
  return {
    ...(data as Record<string, unknown>),
    rates: (asRatesData(data).rates ?? []).map((row) => ({ ...row, setOn: dateOf(row) })),
  }
}

/** Rates are valid one by one, and every currency a language of the site shows has one. */
export const validateRates: GlobalBeforeChangeHook = ({ data, req }) => {
  const fail = (message: string): never => {
    throw new ValidationError({
      global: 'exchange-rates',
      errors: [{ path: 'rates', message }],
      req,
    })
  }
  try {
    const missing = missingDisplayRates(toExchangeRates(asRatesData(data).rates))
    if (missing.length > 0) {
      fail(`The site shows prices in ${missing.join(', ')}: the rate cannot be left out`)
    }
  } catch (error) {
    if (!(error instanceof CurrencyError)) throw error
    fail(error.message)
  }
  return data as Record<string, unknown>
}
