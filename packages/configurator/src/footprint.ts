import type { HouseDesign } from '@kedrovnik/house'

import type { Footprint, ProjectBlueprint } from './model'

export const footprintKey = (footprint: Footprint): string =>
  `${footprint.width}x${footprint.depth}`

export const footprintOf = (design: HouseDesign): Footprint => ({
  width: design.width,
  depth: design.depth,
})

export const sameFootprint = (left: Footprint, right: Footprint): boolean =>
  left.width === right.width && left.depth === right.depth

/** Footprints a project offers: its own first, then the alternatives from smallest to largest. */
export function footprintsOf(blueprint: ProjectBlueprint): readonly Footprint[] {
  const own = footprintOf(blueprint.design)
  const alternatives = blueprint.sizes
    .filter((size, index, all) => all.findIndex((other) => sameFootprint(other, size)) === index)
    .filter((size) => !sameFootprint(size, own))
  return [own, ...alternatives].sort(
    (left, right) => left.width * left.depth - right.width * right.depth,
  )
}

/** Storey layout key used by rules and labels, as in the catalog: `1`, `1-attic`, `2`. */
export const storeyKey = (design: Pick<HouseDesign, 'storeys' | 'attic'>): string =>
  `${design.storeys}${design.attic ? '-attic' : ''}`
