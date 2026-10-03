import { describe, expect, it } from 'vitest'

import {
  activeFilterCount,
  parseCatalogQuery,
  serializeCatalogQuery,
} from '@/modules/catalog/domain/catalog-query'
import { bedroomThresholds, thresholds } from '@/modules/catalog/domain/facets'

describe('catalog query codec', () => {
  it('parses known parameters and keeps defaults', () => {
    const query = parseCatalogQuery({
      type: 'house',
      area_from: '60',
      bedrooms: '2',
      sort: 'price-asc',
    })
    expect(query).toEqual({
      type: 'house',
      areaMin: 60,
      bedroomsMin: 2,
      sort: 'price-asc',
      page: 1,
    })
    expect(activeFilterCount(query)).toBe(3)
  })

  it('drops invalid values one by one instead of failing the whole query', () => {
    const query = parseCatalogQuery({
      type: 'DROP TABLE',
      area_to: '-5',
      budget: '5000000',
      sort: 'random',
      page: '0',
    })
    expect(query).toEqual({ budgetMax: 5_000_000, sort: 'recommended', page: 1 })
  })

  it('takes the first value of repeated parameters', () => {
    expect(parseCatalogQuery({ storeys: ['2', '1'] }).storeys).toBe('2')
  })

  it('round-trips through the URL without defaults', () => {
    const query = parseCatalogQuery({ type: 'sauna', budget: '3000000', page: '2' })
    const serialised = serializeCatalogQuery(query)
    expect(serialised).toBe('type=sauna&budget=3000000&page=2')
    expect(parseCatalogQuery(Object.fromEntries(new URLSearchParams(serialised)))).toEqual(query)
    expect(serializeCatalogQuery({ sort: 'recommended', page: 1 })).toBe('')
  })
})

describe('filter thresholds', () => {
  it('spans the catalog range in fixed steps', () => {
    expect(thresholds({ min: 19, max: 154 }, 20)).toEqual([20, 40, 60, 80, 100, 120, 140, 160])
    expect(thresholds(null, 20)).toEqual([])
    expect(bedroomThresholds([0, 1, 4, 3])).toEqual([1, 2, 3, 4])
  })
})
