import type { HouseFrame } from '../frame/types'
import { traitsOf, type RoomKindCatalog } from '../spec/room-traits'
import { levelCount } from '../spec/house-spec'
import { roundTo, toMetres } from '../units'
import type { Takeoff } from './drivers'

/** Catalog characteristics of a house; stored as a projection for filtering and sorting. */
export interface HouseMetrics {
  readonly totalArea: number
  readonly terraceArea: number
  readonly bedrooms: number
  readonly wetZones: number
  readonly levels: number
  readonly storeys: number
  readonly attic: boolean
  /** Outer dimensions, metres. */
  readonly width: number
  readonly depth: number
  readonly ridgeHeight: number
}

export function computeMetrics(
  frame: HouseFrame,
  takeoff: Takeoff,
  rooms: RoomKindCatalog,
): HouseMetrics {
  const { spec } = frame
  return {
    totalArea: takeoff.totalArea,
    terraceArea: takeoff.terraceArea,
    bedrooms: spec.rooms.filter((room) => traitsOf(rooms, room.kind).bedroom).length,
    wetZones: takeoff.wetZoneCount,
    levels: levelCount(spec),
    storeys: spec.storeys,
    attic: spec.attic,
    width: toMetres(spec.width),
    depth: toMetres(spec.depth),
    ridgeHeight: roundTo(toMetres(frame.roof.ridgeElevation + frame.roof.thickness), 2),
  }
}
