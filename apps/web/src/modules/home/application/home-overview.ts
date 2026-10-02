import type { Locale } from '@/i18n/locales'
import type { BuiltObject } from '@/modules/built-objects/domain/built-object'
import {
  loadProjectOverview,
  type ProjectOverview,
  type ProjectOverviewDeps,
} from '@/modules/catalog/application/project-overview'
import type { ProjectSummary } from '@/modules/catalog/domain/project'
import type {
  TechnologyContent,
  TechnologyRepository,
} from '@/modules/technology/ports/technology-repository'

import type { HomeRepository } from '../ports/home-repository'

export interface HomeOverview {
  readonly hero: ProjectOverview | null
  readonly featured: readonly ProjectSummary[]
  readonly builtObjects: readonly BuiltObject[]
  readonly technology: TechnologyContent
}

export interface HomeOverviewDeps extends ProjectOverviewDeps {
  readonly home: HomeRepository
  readonly technology: TechnologyRepository
}

export async function loadHomeOverview(
  deps: HomeOverviewDeps,
  locale: Locale,
): Promise<HomeOverview> {
  const [selection, technology] = await Promise.all([
    deps.home.load(locale),
    deps.technology.load(),
  ])
  const hero =
    selection.heroProjectSlug === null
      ? null
      : await loadProjectOverview(deps, selection.heroProjectSlug, locale)
  return { hero, featured: selection.featured, builtObjects: selection.builtObjects, technology }
}
