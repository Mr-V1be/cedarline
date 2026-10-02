import type { FacadeFinish, RoofKindKey, WindowStyle } from '@kedrovnik/house'

import type { Footprint } from './model'

/**
 * What the customer has chosen. Every field is a plain value so that a configuration can be
 * stored, sent in a link and compared; the house and the quote are derived from it.
 */
export interface Configuration {
  /** Project of the family (storey variant) the configuration is based on. */
  readonly project: string
  readonly footprint: Footprint
  readonly mirrored: boolean
  readonly roof: RoofKindKey
  readonly facade: FacadeFinish
  /** Facade colour as lower-case #rrggbb. */
  readonly colour: string
  readonly windows: WindowStyle
  /** Terrace depth, mm; 0 means no terrace. */
  readonly terrace: number
  /** Wall insulation, mm. */
  readonly insulation: number
  readonly engineering: readonly string[]
  readonly completeness: string
}

/** Option groups in the order the configurator walks through them. */
export const OPTION_GROUPS = [
  'project',
  'footprint',
  'layout',
  'roof',
  'facade',
  'colour',
  'windows',
  'terrace',
  'insulation',
  'engineering',
  'completeness',
] as const
export type OptionGroup = (typeof OPTION_GROUPS)[number]

/** Groups whose value changes the geometry of the house. */
export const GEOMETRY_GROUPS: ReadonlySet<OptionGroup> = new Set([
  'project',
  'footprint',
  'layout',
  'roof',
  'windows',
  'terrace',
  'insulation',
])

/** Engineering is a set: choosing a system toggles it. Every other group holds one value. */
export const MULTI_GROUPS: ReadonlySet<OptionGroup> = new Set(['engineering'])

/** One choice: a group and a value encoded as a string (footprint `9000x6000`, depth `2400`). */
export interface Choice {
  readonly group: OptionGroup
  readonly value: string
}

export const isOptionGroup = (value: string): value is OptionGroup =>
  (OPTION_GROUPS as readonly string[]).includes(value)
