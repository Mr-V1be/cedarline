import type { HouseFrame } from '../frame/types'
import { toMetres, type Vec3 } from '../units'
import { approachOf, siteAnchorsOf, type Approach, type SiteAnchors } from './anchors'
import { buildChimney, buildFloors, buildPlinth, buildTerrace } from './details'
import { MeshBuilder, type MeshPart } from './mesh-builder'
import { buildOpenings } from './openings'
import { buildRoof } from './roof'
import { worldMapping } from './space'
import { buildCornerBoards, buildWalls } from './walls'

export interface Bounds {
  readonly min: Vec3
  readonly max: Vec3
}

/** Renderer-agnostic mesh of a house: typed arrays per material slot, in metres. */
export interface HouseModel {
  readonly parts: readonly MeshPart[]
  readonly bounds: Bounds
  readonly eaveHeight: number
  readonly ridgeHeight: number
  /** Entrance path anchor for site dressing; null for a house without an exterior door. */
  readonly approach: Approach | null
  readonly site: SiteAnchors
}

function boundsOf(parts: readonly MeshPart[]): Bounds {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const part of parts) {
    for (let index = 0; index < part.positions.length; index += 3) {
      for (let axis = 0; axis < 3; axis += 1) {
        const value = part.positions[index + axis] ?? 0
        min[axis] = Math.min(min[axis] ?? value, value)
        max[axis] = Math.max(max[axis] ?? value, value)
      }
    }
  }
  return {
    min: [min[0] ?? 0, min[1] ?? 0, min[2] ?? 0],
    max: [max[0] ?? 0, max[1] ?? 0, max[2] ?? 0],
  }
}

/** Builds the full mesh of a house from its frame. */
export function buildHouseModel(frame: HouseFrame): HouseModel {
  const builder = new MeshBuilder()
  const mapping = worldMapping(frame.spec)
  buildPlinth(builder, mapping, frame)
  buildWalls(builder, mapping, frame)
  buildCornerBoards(builder, mapping, frame)
  buildOpenings(builder, mapping, frame)
  buildFloors(builder, mapping, frame)
  buildRoof(builder, mapping, frame.roof)
  buildTerrace(builder, mapping, frame)
  buildChimney(builder, mapping, frame)
  const parts = builder.build()
  return {
    parts,
    bounds: boundsOf(parts),
    eaveHeight: toMetres(frame.roof.eaveBase),
    ridgeHeight: toMetres(frame.roof.ridgeElevation + frame.roof.thickness),
    approach: approachOf(frame, mapping),
    site: siteAnchorsOf(frame, mapping),
  }
}
