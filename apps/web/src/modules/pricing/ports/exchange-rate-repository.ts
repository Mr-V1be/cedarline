import type { ExchangeRates } from '../domain/exchange-rate'

/** The current exchange rates staff keep in the CMS: the single source every price reads. */
export interface ExchangeRateRepository {
  load(): Promise<ExchangeRates>
}
