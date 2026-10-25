/** Sort orders of the catalog: a key per order, the repository maps them to fields. */
export const CATALOG_SORTS = [
  'recommended',
  'price-asc',
  'price-desc',
  'area-asc',
  'area-desc',
] as const
export type CatalogSort = (typeof CATALOG_SORTS)[number]
export const DEFAULT_SORT: CatalogSort = 'recommended'

export const CATALOG_PAGE_SIZE = 12

export interface CatalogFilters {
  readonly type?: string
  readonly areaMin?: number
  readonly areaMax?: number
  readonly storeys?: string
  readonly bedroomsMin?: number
  /** In the address: whole units of the visitor's currency; for the repository: rubles. */
  readonly budgetMax?: number
}

export interface CatalogQuery extends CatalogFilters {
  readonly sort: CatalogSort
  readonly page: number
}

/** URL parameter of every query field; the URL is the single state of the catalog. */
export const QUERY_PARAMS = {
  type: 'type',
  areaMin: 'area_from',
  areaMax: 'area_to',
  storeys: 'storeys',
  bedroomsMin: 'bedrooms',
  budgetMax: 'budget',
  sort: 'sort',
  page: 'page',
} as const satisfies Record<keyof CatalogQuery, string>

/** Filter fields in URL order. */
export const FILTER_KEYS = [
  'type',
  'areaMin',
  'areaMax',
  'storeys',
  'bedroomsMin',
  'budgetMax',
] as const satisfies ReadonlyArray<keyof CatalogFilters>

/** Query string without defaults, stable for links and sharing. */
export function serializeCatalogQuery(query: Partial<CatalogQuery>): string {
  const params = new URLSearchParams()
  for (const field of FILTER_KEYS) {
    const value = query[field]
    if (value !== undefined) params.set(QUERY_PARAMS[field], String(value))
  }
  if (query.sort !== undefined && query.sort !== DEFAULT_SORT)
    params.set(QUERY_PARAMS.sort, query.sort)
  if (query.page !== undefined && query.page > 1) params.set(QUERY_PARAMS.page, String(query.page))
  return params.toString()
}

export const activeFilterCount = (query: CatalogFilters): number =>
  FILTER_KEYS.filter((field) => query[field] !== undefined).length

export const withoutFilters = (query: CatalogQuery): CatalogQuery => ({ sort: query.sort, page: 1 })
