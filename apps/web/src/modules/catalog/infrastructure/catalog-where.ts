import type { Sort, Where } from 'payload'

import type { CatalogFilters, CatalogSort } from '../domain/catalog-query'

export const PUBLISHED: Where = { status: { equals: 'published' } }

type FilterClause = (value: never) => Where

/** One clause per filter; a new filter is a new entry here and in the query codec. */
const CLAUSES: {
  readonly [K in keyof Required<CatalogFilters>]: (value: NonNullable<CatalogFilters[K]>) => Where
} = {
  type: (slug) => ({ 'type.slug': { equals: slug } }),
  areaMin: (area) => ({ 'metrics.totalArea': { greater_than_equal: area } }),
  areaMax: (area) => ({ 'metrics.totalArea': { less_than_equal: area } }),
  storeys: (storeyType) => ({ 'metrics.storeyType': { equals: storeyType } }),
  bedroomsMin: (count) => ({ 'metrics.bedrooms': { greater_than_equal: count } }),
  budgetMax: (price) => ({ 'pricing.fromPrice': { less_than_equal: price } }),
}

export function catalogWhere(filters: CatalogFilters): Where {
  const clauses = (Object.keys(CLAUSES) as Array<keyof CatalogFilters>).flatMap((key) => {
    const value = filters[key]
    return value === undefined ? [] : [(CLAUSES[key] as FilterClause)(value as never)]
  })
  return { and: [PUBLISHED, ...clauses] }
}

/** Every order ends with the id so that pages never shuffle between requests. */
export const CATALOG_SORT_FIELDS: Readonly<Record<CatalogSort, Sort>> = {
  recommended: ['sortOrder', 'id'],
  'price-asc': ['pricing.fromPrice', 'id'],
  'price-desc': ['-pricing.fromPrice', 'id'],
  'area-asc': ['metrics.totalArea', 'id'],
  'area-desc': ['-metrics.totalArea', 'id'],
}
