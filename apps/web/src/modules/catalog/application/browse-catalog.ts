import { Money } from '@cedarline/pricing'

import type { Locale } from '@/i18n/locales'
import { toBaseMoney, toMinor } from '@/modules/pricing/domain/conversion'
import type { DisplayCurrency } from '@/modules/pricing/domain/exchange-rate'

import type { CatalogQuery } from '../domain/catalog-query'
import type { CatalogFacets } from '../domain/facets'
import type { ProjectSummary } from '../domain/project'
import type { Page, ProjectRepository } from '../ports/project-repository'

export interface CatalogView {
  readonly page: Page<ProjectSummary>
  readonly facets: CatalogFacets
}

/**
 * A catalog page and its filters. The budget comes in the visitor's currency and is turned
 * into the tariff's rubles here, the one place the catalog meets another currency.
 */
export async function browseCatalog(
  projects: ProjectRepository,
  query: CatalogQuery,
  locale: Locale,
  currency: DisplayCurrency,
): Promise<CatalogView> {
  const inRubles: CatalogQuery =
    query.budgetMax === undefined
      ? query
      : {
          ...query,
          budgetMax: Money.toWholeRubles(
            toBaseMoney(toMinor(query.budgetMax, currency.currency), currency),
          ),
        }
  const [page, facets] = await Promise.all([
    projects.list(inRubles, locale),
    projects.facets(locale),
  ])
  return { page, facets }
}
