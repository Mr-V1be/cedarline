import type { Payload, PayloadRequest } from 'payload'

import type { Locale } from '@/i18n/locales'

import type { Tariff, TariffRepository } from '../ports/tariff-repository'
import { toTariffGrid, toTariffNames } from './tariff-mapper'

export class PayloadTariffRepository implements TariffRepository {
  constructor(
    private readonly payload: Payload,
    private readonly locale: Locale,
    private readonly req?: PayloadRequest,
  ) {}

  async load(): Promise<Tariff> {
    const document = await this.payload.findGlobal({
      slug: 'tariff',
      locale: this.locale,
      depth: 0,
      ...(this.req === undefined ? {} : { req: this.req }),
    })
    return { grid: toTariffGrid(document), names: toTariffNames(document) }
  }
}
