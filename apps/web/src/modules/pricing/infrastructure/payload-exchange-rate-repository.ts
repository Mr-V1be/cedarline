import type { Payload } from 'payload'

import type { ExchangeRates } from '../domain/exchange-rate'
import type { ExchangeRateRepository } from '../ports/exchange-rate-repository'
import { toExchangeRates } from './exchange-rate-mapper'

/** The rates staff keep in the CMS global «Exchange rates». */
export class PayloadExchangeRateRepository implements ExchangeRateRepository {
  constructor(private readonly payload: Payload) {}

  async load(): Promise<ExchangeRates> {
    const document = await this.payload.findGlobal({ slug: 'exchange-rates', depth: 0 })
    return toExchangeRates(document.rates)
  }
}
