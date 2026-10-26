import type { ConfiguratorOffer } from '@cedarline/configurator'

import type { Locale } from '@/i18n/locales'

export interface ConfiguratorOptions {
  readonly offer: ConfiguratorOffer
  readonly colours: Readonly<Record<string, string>>
  readonly systems: Readonly<Record<string, string>>
  readonly rules: Readonly<Record<string, string>>
}

/** The catalog-wide offer: options, palettes, systems and compatibility rules. */
export interface ConfiguratorOptionsRepository {
  load(locale: Locale): Promise<ConfiguratorOptions>
}
