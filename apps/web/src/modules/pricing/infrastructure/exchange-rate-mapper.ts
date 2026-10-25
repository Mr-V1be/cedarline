import { isCurrencyCode } from '../domain/currencies'
import { CurrencyError, validateExchangeRates, type ExchangeRates } from '../domain/exchange-rate'

/** A rate row as the CMS global «Exchange rates» stores it. */
export interface StoredExchangeRate {
  readonly currency: string
  readonly rate: number
  readonly setOn?: string | null
}

/** CMS rows → validated domain rates. Throws CurrencyError on any inconsistency. */
export function toExchangeRates(
  rows: readonly StoredExchangeRate[] | null | undefined,
): ExchangeRates {
  return validateExchangeRates(
    (rows ?? []).map((row) => {
      if (!isCurrencyCode(row.currency)) {
        throw new CurrencyError('UNKNOWN_CURRENCY', `Unknown currency ${row.currency}`, {
          currency: row.currency,
        })
      }
      return { currency: row.currency, rate: row.rate, setOn: row.setOn ?? '' }
    }),
  )
}
