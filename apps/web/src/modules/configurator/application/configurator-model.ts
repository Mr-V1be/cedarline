import type { ConfiguratorModel } from '@cedarline/configurator'

import type { Locale } from '@/i18n/locales'
import type { HouseContextRepository } from '@/modules/catalog/ports/house-context-repository'
import type { TariffRepository } from '@/modules/pricing/ports/tariff-repository'
import type { TechnologyRepository } from '@/modules/technology/ports/technology-repository'

import type { ConfiguratorNames } from '../domain/names'
import type { ConfiguratorOptionsRepository } from '../ports/configurator-options-repository'
import type { ProjectFamily, ProjectFamilyRepository } from '../ports/project-family-repository'

export interface ConfiguratorDeps {
  readonly families: ProjectFamilyRepository
  readonly options: ConfiguratorOptionsRepository
  readonly houseContext: HouseContextRepository
  /** The tariff with names in the given language. */
  readonly tariff: (locale: Locale) => TariffRepository
  readonly technology: TechnologyRepository
}

export interface LoadedModel {
  readonly family: ProjectFamily
  readonly model: ConfiguratorModel
  readonly names: ConfiguratorNames
  readonly tariffRevision: number
}

/** The configurator's input for a project's series, with display names in one language. */
export async function loadModel(
  deps: ConfiguratorDeps,
  slug: string,
  locale: Locale,
): Promise<LoadedModel | null> {
  const [family, options, context, tariff] = await Promise.all([
    deps.families.findFamily(slug, locale),
    deps.options.load(locale),
    deps.houseContext.load(locale),
    deps.tariff(locale).load(),
  ])
  if (family === null) return null
  return {
    family,
    model: {
      family: family.members.map((member) => member.blueprint),
      offer: options.offer,
      house: { rooms: context.rooms, standards: context.standards },
      grid: tariff.grid,
    },
    names: {
      projects: Object.fromEntries(
        family.members.map((member) => [member.blueprint.slug, member.title]),
      ),
      colours: options.colours,
      systems: options.systems,
      rules: options.rules,
      tariff: tariff.names,
    },
    tariffRevision: tariff.grid.revision,
  }
}

/** Names only, for another language of an already loaded series. */
export async function loadNames(
  deps: ConfiguratorDeps,
  slug: string,
  locale: Locale,
): Promise<ConfiguratorNames | null> {
  const loaded = await loadModel(deps, slug, locale)
  return loaded?.names ?? null
}
