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
  /** Amounts in the query are the tariff's rubles. */
  list(query: CatalogQuery, locale: Locale): Promise<Page<ProjectSummary>>
  facets(locale: Locale): Promise<CatalogFacets>
  findBySlug(slug: string, locale: Locale): Promise<ProjectDetails | null>
  findSimilar(
    project: ProjectSummary,
    limit: number,
    locale: Locale,
  ): Promise<readonly ProjectSummary[]>
  /** Every published project with its «price from», in catalog order, for pickers. */
  priceList(locale: Locale): Promise<readonly ProjectPrice[]>
  /** Slugs and update times of every published project, for the sitemap. */
  sitemap(): Promise<ReadonlyArray<{ readonly slug: string; readonly updatedAt: Date }>>
}

export interface ProjectPrice {
  readonly slug: string
  readonly title: string
  /** Whole rubles. */
  readonly fromPrice: number
}
