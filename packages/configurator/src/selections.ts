import type { HouseDesign, HouseOptions } from '@kedrovnik/house'
import type { Selections } from '@kedrovnik/pricing'

import type { Configuration } from './configuration'
import { storeyKey } from './footprint'

/**
 * Option codes that tariff conditions and compatibility rules may test. Rules and prices speak
 * the same vocabulary, so a content manager learns it once.
 */
export const SELECTION_OPTIONS = [
  'storeys',
  'layout',
  'roof',
  'facade',
  'windows',
  'terrace',
  'insulation',
  'engineering',
] as const
export type SelectionOption = (typeof SELECTION_OPTIONS)[number]

type SelectionValues = Readonly<Record<SelectionOption, string | readonly string[]>>

/** Selection values of a configuration; `design` is the design of the configured project. */
export function selectionsOf(configuration: Configuration, design: HouseDesign): Selections {
  const values: SelectionValues = {
    storeys: storeyKey(design),
    layout: configuration.mirrored ? 'mirrored' : 'base',
    roof: configuration.roof,
    facade: configuration.facade,
    windows: configuration.windows,
    terrace: String(configuration.terrace),
    insulation: String(configuration.insulation),
    engineering: configuration.engineering,
  }
  return values
}

/** Selection values of a catalog project as designed, before any configuration. */
export function designSelections(
  design: HouseDesign,
  options: HouseOptions,
  engineering: readonly string[],
): Selections {
  const terrace =
    options.terraceDepth === null ? 0 : (options.terraceDepth ?? design.terrace?.depth ?? 0)
  const values: SelectionValues = {
    storeys: storeyKey(design),
    layout: 'base',
    roof: options.roofKind,
    facade: options.facadeFinish,
    windows: options.windowStyle,
    terrace: String(terrace),
    insulation: String(options.insulation),
    engineering,
  }
  return values
}
