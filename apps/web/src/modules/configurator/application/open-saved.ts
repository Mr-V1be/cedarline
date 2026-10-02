import { Configurator, isShareCode } from '@kedrovnik/configurator'
import { Money } from '@kedrovnik/pricing'

import type { Locale } from '@/i18n/locales'

import type { ConfiguratorNames } from '../domain/names'
import type { SavedConfiguration } from '../domain/snapshot'
import type { SavedConfigurationRepository } from '../ports/saved-configuration-repository'
import type { ConfiguratorDeps } from './configurator-model'
import { openConfigurator } from './open-configurator'

export interface SavedView {
  readonly saved: SavedConfiguration
  readonly names: ConfiguratorNames
  /**
   * The same choices priced today, when the catalog still offers them and the price differs;
   * the saved figures stay what the customer saw.
   */
  readonly current: { readonly total: number; readonly tariffRevision: number } | null
  /** Whether the same choices can still be configured in today's catalog. */
  readonly repeatable: boolean
}

export interface OpenSavedDeps extends ConfiguratorDeps {
  readonly saved: SavedConfigurationRepository
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

  const live = await openConfigurator(deps, saved.projectSlug, locale, snapshot.configuration)
  let current: SavedView['current'] = null
  if (live !== null && !live.restoredWithChanges) {
    const total = new Configurator(live.model).quote(live.initial).estimate.total
    if (total !== snapshot.estimate.total) {
      current = { total: Money.toWholeRubles(total), tariffRevision: live.model.grid.revision }
    }
  }
  return { saved, names, current, repeatable: live !== null && !live.restoredWithChanges }
}
