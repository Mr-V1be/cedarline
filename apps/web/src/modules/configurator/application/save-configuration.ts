import {
  Configurator,
  parseConfiguration,
  unofferedGroups,
  ConfiguratorError,
} from '@kedrovnik/configurator'

import { LOCALES, type Locale } from '@/i18n/locales'

import type { ConfiguratorNames } from '../domain/names'
import { SNAPSHOT_VERSION, type ConfigurationSnapshot } from '../domain/snapshot'
import type { DocumentStore } from '../ports/document-store'
import type { RenderImages } from '../ports/render-images'
import type { SavedConfigurationRepository } from '../ports/saved-configuration-repository'
import type { ShareCodeSource } from '../ports/share-code-source'
import { loadModel, type ConfiguratorDeps } from './configurator-model'

export interface SaveDeps extends ConfiguratorDeps {
  readonly saved: SavedConfigurationRepository
  readonly documents: DocumentStore
  readonly renders: RenderImages
  readonly codes: ShareCodeSource
  readonly clock: () => Date
}

export interface SaveRequest {
  /** Untrusted: whatever the browser sent. */
  readonly configuration: unknown
  readonly locale: Locale
  /** The scene as the customer saw it, JPEG; optional when WebGL is unavailable. */
  readonly render: Buffer | null
}

export type SaveResult =
  | { readonly ok: true; readonly code: string }
  | { readonly ok: false; readonly reason: 'invalid' | 'unavailable' }

/** A fresh code collides with a stored one about never; a few attempts are plenty. */
const CODE_ATTEMPTS = 3

/**
 * Saves a configuration behind a short unguessable code. The server recomputes everything
 * from the choices: the browser's prices are never trusted, and the snapshot freezes what
 * the configuration costs under the current tariff.
 */
export async function saveConfiguration(deps: SaveDeps, request: SaveRequest): Promise<SaveResult> {
  let configuration
  try {
    configuration = parseConfiguration(request.configuration)
  } catch (error) {
    if (error instanceof ConfiguratorError) return { ok: false, reason: 'invalid' }
    throw error
  }

  const loaded = await loadModel(deps, configuration.project, request.locale)
  if (loaded === null) return { ok: false, reason: 'unavailable' }
  const member = loaded.family.members.find(
    (candidate) => candidate.blueprint.slug === configuration.project,
  )
  const configurator = new Configurator(loaded.model)
  if (
    member === undefined ||
    unofferedGroups(loaded.model, configuration).length > 0 ||
    configurator.restrictionsOf(configuration).length > 0
  ) {
    return { ok: false, reason: 'invalid' }
  }
  const state = configurator.evaluate(configuration)

  const names: Partial<Record<Locale, ConfiguratorNames>> = { [request.locale]: loaded.names }
  for (const locale of LOCALES) {
    if (names[locale] !== undefined) continue
    const other = await loadModel(deps, configuration.project, locale)
    if (other !== null) names[locale] = other.names
  }

  const snapshot: ConfigurationSnapshot = {
    version: SNAPSHOT_VERSION,
    savedAt: deps.clock().toISOString(),
    configuration,
    house: { ...state.house, standards: loaded.model.house.standards },
    metrics: state.measured.metrics,
    estimate: state.quote.estimate,
    schedule: state.quote.schedule,
    tariffRevision: loaded.tariffRevision,
    names,
  }

  const render =
    request.render === null ? null : await deps.renders.normalise(request.render).catch(() => null)
  const code = deps.codes.next()
  const renderDocument =
    render === null
      ? null
      : await deps.documents.save('render', `render-${code}.jpg`, 'image/jpeg', render)

  for (let attempt = 0; ; attempt += 1) {
    const candidate = attempt === 0 ? code : deps.codes.next()
    try {
      await deps.saved.create({
        code: candidate,
        projectId: member.id,
        locale: request.locale,
        snapshot,
        renderId: renderDocument?.id ?? null,
      })
      return { ok: true, code: candidate }
    } catch (error) {
      if (attempt + 1 >= CODE_ATTEMPTS) throw error
    }
  }
}
