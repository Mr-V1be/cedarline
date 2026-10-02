import type { Locale } from '@/i18n/locales'

import type { CatalogQuery } from '../domain/catalog-query'
import type { CatalogFacets } from '../domain/facets'
import type { ProjectSummary } from '../domain/project'
import type { Page, ProjectRepository } from '../ports/project-repository'

export interface CatalogView {
  readonly page: Page<ProjectSummary>
  readonly facets: CatalogFacets
}

export async function browseCatalog(
  projects: ProjectRepository,
  query: CatalogQuery,
  locale: Locale,
): Promise<CatalogView> {
  const [page, facets] = await Promise.all([projects.list(query, locale), projects.facets(locale)])
  return { page, facets }
}
