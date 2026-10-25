import type { Locale } from '@/i18n/locales'
import { displayCurrencyFor, type DisplayCurrency } from '@/modules/pricing/domain/exchange-rate'
import type { ExchangeRateRepository } from '@/modules/pricing/ports/exchange-rate-repository'

import type { ConfigurationSnapshot } from '../domain/snapshot'

/**
 * Prices of a saved configuration in a language: at the rates it was saved with, so its link,
 * its proposal and its lead show the same figures. A configuration saved before rates were
 * kept converts at today's.
 */
export async function savedPrices(
  snapshot: ConfigurationSnapshot,
  locale: Locale,
  today: ExchangeRateRepository,
): Promise<DisplayCurrency> {
  return displayCurrencyFor(locale, snapshot.exchangeRates ?? (await today.load()))
}
