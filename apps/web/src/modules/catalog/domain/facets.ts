import type { ProjectTypeRef } from './project'

export interface Range {
  readonly min: number
  readonly max: number
}

/** What the published catalog contains: the filters offer only values that can match. */
export interface CatalogFacets {
  readonly types: readonly ProjectTypeRef[]
  readonly storeyTypes: readonly string[]
  readonly bedrooms: readonly number[]
  readonly area: Range | null
  readonly price: Range | null
}

/** Area thresholds every 20 m², price thresholds every 1 000 000 ₽, spanning the catalog. */
export const AREA_STEP = 20
export const PRICE_STEP = 1_000_000

export function thresholds(range: Range | null, step: number): number[] {
  if (range === null) return []
  const start = Math.floor(range.min / step) * step
  const end = Math.ceil(range.max / step) * step
  const values: number[] = []
  for (let value = Math.max(step, start); value <= end; value += step) values.push(value)
  return values
}

/** «From N bedrooms» choices: 1 up to the largest count in the catalog. */
export function bedroomThresholds(bedrooms: readonly number[]): number[] {
  const max = Math.max(0, ...bedrooms)
  return Array.from({ length: max }, (_, index) => index + 1)
}
