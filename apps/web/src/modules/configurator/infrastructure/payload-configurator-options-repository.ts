import type { Payload, PayloadRequest } from 'payload'

import type { Locale } from '@/i18n/locales'
import type { TechnologyRepository } from '@/modules/technology/ports/technology-repository'

import type {
  ConfiguratorOptions,
  ConfiguratorOptionsRepository,
} from '../ports/configurator-options-repository'
import { toConfiguratorOptions } from './options-mapper'

export class PayloadConfiguratorOptionsRepository implements ConfiguratorOptionsRepository {
  constructor(
    private readonly payload: Payload,
    private readonly technology: TechnologyRepository,
    private readonly req?: PayloadRequest,
  ) {}

  async load(locale: Locale): Promise<ConfiguratorOptions> {
    const [document, technology] = await Promise.all([
      this.payload.findGlobal({
        slug: 'catalog-options',
        locale,
        depth: 0,
        ...(this.req === undefined ? {} : { req: this.req }),
      }),
      this.technology.load(),
    ])
    return toConfiguratorOptions(document, technology.insulationOptions)
  }
}
