import { DEFAULT_STANDARDS, type ConstructionStandards } from '@cedarline/house'

import { resolveWall, type WallLayer } from '../domain/wall-assembly'

/**
 * Factory standards with the wall skin taken from the published wall assembly, so the section
 * drawn on the site and the walls of every house are the same wall.
 */
export function standardsFor(
  layers: readonly WallLayer[],
  insulation: number,
): ConstructionStandards {
  return { ...DEFAULT_STANDARDS, wallSkinThickness: resolveWall(layers, insulation).skinThickness }
}
