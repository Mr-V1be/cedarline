import { z } from 'zod'

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

const FILTER_KEYS = [
  'type',
  'areaMin',
  'areaMax',
  'storeys',
  'bedroomsMin',
  'budgetMax',
] as const satisfies ReadonlyArray<keyof CatalogFilters>

const positiveInt = z.coerce.number().int().positive()
const key = z.string().regex(/^[a-z0-9-]+$/)

/** Each field is parsed on its own: one bad parameter is dropped, the rest still apply. */
const fieldSchemas = {
  type: key,
  areaMin: positiveInt,
  areaMax: positiveInt,
  storeys: key,
  bedroomsMin: positiveInt,
  budgetMax: positiveInt,
  sort: z.enum(CATALOG_SORTS),
  page: positiveInt,
} as const

export type SearchParams = Readonly<Record<string, string | readonly string[] | undefined>>

function first(value: string | readonly string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : value?.[0]
}

export function parseCatalogQuery(params: SearchParams): CatalogQuery {
  const read = <K extends keyof typeof fieldSchemas>(
    field: K,
  ): z.infer<(typeof fieldSchemas)[K]> | undefined => {
    const parsed = fieldSchemas[field].safeParse(first(params[QUERY_PARAMS[field]]))
    return parsed.success ? (parsed.data as z.infer<(typeof fieldSchemas)[K]>) : undefined
  }
  const filters: Record<string, string | number> = {}
  for (const field of FILTER_KEYS) {
    const value = read(field)
    if (value !== undefined) filters[field] = value
  }
  return {
    ...(filters as CatalogFilters),
    sort: read('sort') ?? DEFAULT_SORT,
    page: read('page') ?? 1,
  }
}

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
