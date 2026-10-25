import { Configurator, isShareCode } from '@kedrovnik/configurator'
import type { Money } from '@kedrovnik/pricing'

import type { Locale } from '@/i18n/locales'
import { toDisplayMinor } from '@/modules/pricing/domain/conversion'
import { displayCurrencyFor, type DisplayCurrency } from '@/modules/pricing/domain/exchange-rate'
import type { ExchangeRateRepository } from '@/modules/pricing/ports/exchange-rate-repository'

import type { ConfiguratorNames } from '../domain/names'
import type { SavedConfiguration } from '../domain/snapshot'
import type { SavedConfigurationRepository } from '../ports/saved-configuration-repository'
import type { ConfiguratorDeps } from './configurator-model'
import { openConfigurator } from './open-configurator'
import { savedPrices } from './saved-prices'

export interface SavedView {
  readonly saved: SavedConfiguration
  readonly names: ConfiguratorNames
  /** The saved figures as the visitor reads them: their currency at the rates of saving. */
  readonly prices: DisplayCurrency
  /**
   * The same choices priced today, when the catalog still offers them and today's figure, as
   * the visitor reads it, differs (the tariff or the rate moved); the saved figures stay what
   * the customer saw.
   */
  readonly current: {
    readonly total: Money
    readonly tariffRevision: number
    readonly prices: DisplayCurrency
  } | null
  /** Whether the same choices can still be configured in today's catalog. */
  readonly repeatable: boolean
}

export interface OpenSavedDeps extends ConfiguratorDeps {
  readonly saved: SavedConfigurationRepository
  readonly exchangeRates: ExchangeRateRepository
}

/** Reads a saved configuration by its code exactly as it was saved. */
export async function openSaved(
  deps: OpenSavedDeps,
  code: string,
  locale: Locale,
): Promise<SavedView | null> {
  if (!isShareCode(code)) return null
  const saved = await deps.saved.findByCode(code)
  if (saved === null) return null
  const { snapshot } = saved
  const names = snapshot.names[locale] ?? snapshot.names[saved.locale]
  if (names === undefined) return null

  const [live, prices] = await Promise.all([
    openConfigurator(deps, saved.projectSlug, locale, snapshot.configuration),
    savedPrices(snapshot, locale, deps.exchangeRates),
  ])
  let current: SavedView['current'] = null
  if (live !== null && !live.restoredWithChanges) {
    const total = new Configurator(live.model).quote(live.initial).estimate.total
    const today = displayCurrencyFor(locale, await deps.exchangeRates.load())
    if (
      today.currency !== prices.currency ||
      toDisplayMinor(total, today, 'exact') !==
        toDisplayMinor(snapshot.estimate.total, prices, 'exact')
    ) {
      current = { total, tariffRevision: live.model.grid.revision, prices: today }
    }
  }
  return { saved, names, prices, current, repeatable: live !== null && !live.restoredWithChanges }
}
