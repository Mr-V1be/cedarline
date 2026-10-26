import {
  initialConfiguration,
  parseConfiguration,
  unofferedGroups,
  Configurator,
  type Configuration,
  type ConfiguratorModel,
} from '@cedarline/configurator'

import type { Locale } from '@/i18n/locales'
import type { ImageAsset } from '@/modules/catalog/domain/project'

import type { WallLayerContent } from '@/modules/technology/ports/technology-repository'

import type { ConfiguratorNames } from '../domain/names'
import { loadModel, type ConfiguratorDeps } from './configurator-model'

export interface SeriesMember {
  readonly slug: string
  readonly title: string
  readonly cover: ImageAsset | null
}

/** Everything the configurator page sends to the browser: plain, serialisable data. */
export interface ConfiguratorView {
  readonly model: ConfiguratorModel
  readonly names: ConfiguratorNames
  readonly members: readonly SeriesMember[]
  readonly initial: Configuration
  /** True when a requested starting configuration could not be restored as it was. */
  readonly restoredWithChanges: boolean
  /** The wall assembly, drawn next to the insulation choice. */
  readonly wallLayers: readonly WallLayerContent[]
}

/** Whether a stored configuration is still offered and buildable in the current catalog. */
function stillPossible(model: ConfiguratorModel, candidate: unknown): Configuration | null {
  try {
    const configuration = parseConfiguration(candidate)
    if (unofferedGroups(model, configuration).length > 0) return null
    return new Configurator(model).restrictionsOf(configuration).length === 0 ? configuration : null
  } catch {
    return null
  }
}

/**
 * Opens the configurator on a project, optionally from a stored configuration (a saved link
 * the customer wants to change). A configuration that is no longer possible falls back to
 * the project's defaults, and the page says so.
 */
export async function openConfigurator(
  deps: ConfiguratorDeps,
  slug: string,
  locale: Locale,
  start?: unknown,
): Promise<ConfiguratorView | null> {
  const [loaded, technology] = await Promise.all([
    loadModel(deps, slug, locale),
    deps.technology.load(),
  ])
  if (loaded === null) return null
  const restored = start === undefined ? null : stillPossible(loaded.model, start)
  return {
    model: loaded.model,
    names: loaded.names,
    members: loaded.family.members.map((member) => ({
      slug: member.blueprint.slug,
      title: member.title,
      cover: member.cover,
    })),
    initial: restored ?? initialConfiguration(loaded.model, slug),
    restoredWithChanges: start !== undefined && restored === null,
    wallLayers: technology.layers,
  }
}
