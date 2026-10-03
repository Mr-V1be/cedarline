import type { BuiltObject } from './built-object'

/** Facts about the built houses, computed from the houses themselves. */
export interface ObjectsSummary {
  readonly count: number
  readonly settlements: number
  readonly firstYear: number | null
  readonly lastYear: number | null
  /** Total area of the houses, m². */
  readonly totalArea: number
}

export function summarizeObjects(objects: readonly BuiltObject[]): ObjectsSummary {
  const years = objects.map((object) => object.year)
  return {
    count: objects.length,
    settlements: new Set(objects.map((object) => object.settlement)).size,
    firstYear: years.length === 0 ? null : Math.min(...years),
    lastYear: years.length === 0 ? null : Math.max(...years),
    totalArea: Math.round(objects.reduce((sum, object) => sum + object.area, 0)),
  }
}
