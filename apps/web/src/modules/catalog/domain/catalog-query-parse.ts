import { z } from 'zod'

import {
  CATALOG_SORTS,
  DEFAULT_SORT,
  FILTER_KEYS,
  QUERY_PARAMS,
  type CatalogFilters,
  type CatalogQuery,
} from './catalog-query'

/*
 * Parsing the catalog address is server work: it lives apart from the query model so that the
 * schema library stays out of the browser bundle of the catalog filters.
 */
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
