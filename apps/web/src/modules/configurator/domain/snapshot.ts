import type { Configuration } from '@cedarline/configurator'
import type { HouseMetrics } from '@cedarline/house'
import type { Estimate, Schedule } from '@cedarline/pricing'

import type { Locale } from '@/i18n/locales'
import type { HouseViewerInput } from '@/modules/catalog/application/project-overview'
import type { ExchangeRates } from '@/modules/pricing/domain/exchange-rate'

import type { ConfiguratorNames } from './names'

export const SNAPSHOT_VERSION = 1

/**
 * Everything a saved configuration showed, frozen at the moment of saving: the link and the
 * proposal reproduce it exactly even after the catalog, the design or the tariff change.
 */
export interface ConfigurationSnapshot {
  readonly version: typeof SNAPSHOT_VERSION
  readonly savedAt: string
  readonly configuration: Configuration
  readonly house: HouseViewerInput
  readonly metrics: HouseMetrics
  readonly estimate: Estimate
  readonly schedule: Schedule
  readonly tariffRevision: number
  /**
   * The exchange rates of the day it was saved: the link, the proposal and the lead convert
   * at them, so a figure in another currency stays the one the customer saw. Absent in
   * configurations saved before prices were shown in other currencies.
   */
  readonly exchangeRates?: ExchangeRates
  /** Names in every language, so the link reads the same in either. */
  readonly names: Readonly<Partial<Record<Locale, ConfiguratorNames>>>
}

/** A saved configuration as the site reads it back by its share code. */
export interface SavedConfiguration {
  readonly id: number
  readonly code: string
  readonly projectSlug: string
  readonly locale: Locale
  readonly snapshot: ConfigurationSnapshot
  readonly renderId: number | null
  readonly proposalId: number | null
}
