import { getFormatter, getTranslations } from 'next-intl/server'

import { formatRublesCompact } from '@/modules/pricing/ui/money'

import { CATALOG_SORTS } from '../domain/catalog-query'
import {
  AREA_STEP,
  PRICE_STEP,
  bedroomThresholds,
  thresholds,
  type CatalogFacets,
} from '../domain/facets'
import type { FilterField } from './catalog-filter-fields'

/** Filter dropdowns built from what the published catalog actually contains. */
export async function catalogFields(facets: CatalogFacets): Promise<FilterField[]> {
  const [t, format] = await Promise.all([getTranslations(), getFormatter()])
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
        ...thresholds(facets.price, PRICE_STEP).map((value) => ({
          value: String(value),
          label: formatRublesCompact(format, value),
        })),
      ],
    },
  ]
}

export async function sortOptions() {
  const t = await getTranslations('registry.catalogSort')
  return CATALOG_SORTS.map((sort) => ({ value: sort, label: t(sort) }))
}
