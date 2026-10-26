import { Money } from '@cedarline/pricing'
import { getTranslations } from 'next-intl/server'

import { createPriceFormatter } from '@/modules/pricing/application/price-formatter'
import type { DisplayCurrency } from '@/modules/pricing/domain/exchange-rate'

import { CATALOG_SORTS } from '../domain/catalog-query'
import { AREA_STEP, bedroomThresholds, thresholds, type CatalogFacets } from '../domain/facets'
import type { FilterField } from './catalog-filter-fields'

/**
 * Filter dropdowns built from what the published catalog actually contains. Budgets are round
 * figures of the visitor's currency, spanning the catalog's «from» prices as the visitor reads
 * them.
 */
export async function catalogFields(
  facets: CatalogFacets,
  currency: DisplayCurrency,
): Promise<FilterField[]> {
  const t = await getTranslations()
  const prices = createPriceFormatter(currency)
  const budgets =
    facets.price === null
      ? null
      : {
          min: prices.value(Money.ofRubles(facets.price.min), 'from'),
          max: prices.value(Money.ofRubles(facets.price.max), 'from'),
        }
  const storeyTypes = facets.storeyTypes.filter((key) =>
    t.has(`registry.storeyType.${key}` as 'registry.storeyType.1'),
  )
  const areas = thresholds(facets.area, AREA_STEP)
  const areaOptions = areas.map((value) => ({
    value: String(value),
    label: t('catalog.filters.area', { value }),
  }))
  const any = (label: string) => ({ value: '', label })
  return [
    {
      key: 'type',
      label: t('catalog.filters.type'),
      options: [
        any(t('catalog.filters.anyType')),
        ...facets.types.map((type) => ({ value: type.slug, label: type.title })),
      ],
    },
    {
      key: 'areaMin',
      group: 'area',
      label: t('catalog.filters.areaFrom'),
      options: [any(t('catalog.filters.anyArea')), ...areaOptions],
    },
    {
      key: 'areaMax',
      group: 'area',
      label: t('catalog.filters.areaTo'),
      options: [any(t('catalog.filters.anyArea')), ...areaOptions],
    },
    {
      key: 'storeys',
      label: t('catalog.filters.storeys'),
      options: [
        any(t('catalog.filters.anyStoreys')),
        ...storeyTypes.map((key) => ({
          value: key,
          label: t(`registry.storeyType.${key}` as 'registry.storeyType.1'),
        })),
      ],
    },
    {
      key: 'bedroomsMin',
      label: t('catalog.filters.bedrooms'),
      options: [
        any(t('catalog.filters.anyBedrooms')),
        ...bedroomThresholds(facets.bedrooms).map((count) => ({
          value: String(count),
          label: t('catalog.filters.bedroomsFrom', { count }),
        })),
      ],
    },
    {
      key: 'budgetMax',
      label: t('catalog.filters.budget'),
      options: [
        any(t('catalog.filters.anyBudget')),
        ...thresholds(budgets, prices.thresholdStep).map((value) => ({
          value: String(value),
          label: prices.compact(value),
        })),
      ],
    },
  ]
}

export async function sortOptions() {
  const t = await getTranslations('registry.catalogSort')
  return CATALOG_SORTS.map((sort) => ({ value: sort, label: t(sort) }))
}
