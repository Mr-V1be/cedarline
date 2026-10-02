import type { Locale } from '@/i18n/locales'

import type { CatalogQuery } from '../domain/catalog-query'
import type { CatalogFacets } from '../domain/facets'
import type { ProjectDetails, ProjectSummary } from '../domain/project'

export interface Page<T> {
  readonly items: readonly T[]
  readonly total: number
  readonly page: number
  readonly pageCount: number
}

export interface ProjectRepository {
  list(query: CatalogQuery, locale: Locale): Promise<Page<ProjectSummary>>
  facets(locale: Locale): Promise<CatalogFacets>
  findBySlug(slug: string, locale: Locale): Promise<ProjectDetails | null>
  findSimilar(
    project: ProjectSummary,
    limit: number,
    locale: Locale,
  ): Promise<readonly ProjectSummary[]>
}
