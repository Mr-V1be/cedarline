import type { HouseFrame } from '../frame/types'
import { extendProfile, polylineLength } from '../roof/profile'
import { traitsOf, type RoomKindCatalog } from '../spec/room-traits'
import { roundTo, toMetres, toSquareMetres, type Vec2 } from '../units'
import type { Takeoff } from './drivers'
import { netRoomArea } from './rooms'

const AREA_DECIMALS = 2

/** Shoelace area of a simple polygon. */
function polygonArea(points: readonly Vec2[]): number {
  let doubled = 0
  points.forEach(([u, v], index) => {
    const next = points[(index + 1) % points.length]
    if (next !== undefined) doubled += u * next[1] - next[0] * v
  })
  return Math.abs(doubled) / 2
}

const gridPiles = (a: number, b: number, spacing: number) =>
  (Math.ceil(a / spacing) + 1) * (Math.ceil(b / spacing) + 1)

const squareMetres = (squareMillimetres: number) =>
  roundTo(toSquareMetres(squareMillimetres), AREA_DECIMALS)

/** Measures every quantity driver of a house. */
export function computeTakeoff(frame: HouseFrame, rooms: RoomKindCatalog): Takeoff {
  const { spec, roof, walls, terrace } = frame
  const { standards } = spec
  const inner = (spec.width - 2 * spec.wallThickness) * (spec.depth - 2 * spec.wallThickness)
  const upperFloors = spec.storeys - 1 + (spec.attic ? 1 : 0)

  const openings = walls.flatMap((wall) => wall.openings)
  const openingArea = (filter: (frame: (typeof openings)[number]) => boolean) =>
    openings
      .filter(filter)
      .reduce((sum, item) => sum + (item.u1 - item.u0) * (item.v1 - item.v0), 0)
  const windows = openings.filter((item) => item.opening.type === 'window')

  const wallArea = walls.reduce((sum, wall) => sum + polygonArea(wall.polygon), 0)
  const allOpenings = openingArea(() => true)
  const roofWidth = roof.length + 2 * roof.gableOverhang
  const roofSlope = polylineLength(extendProfile(roof.profile, roof.eaveOverhang))
  const insulatedSlope = spec.attic ? polylineLength(roof.profile.points) : 0

  return {
    lumpSum: 1,
    totalArea: roundTo(
      spec.rooms.reduce((sum, room) => sum + netRoomArea(spec, room), 0),
      AREA_DECIMALS,
    ),
    footprintArea: squareMetres(spec.width * spec.depth),
    groundFloorArea: squareMetres(inner),
    slabArea: squareMetres(inner * upperFloors),
    ceilingArea: spec.attic ? 0 : squareMetres(inner),
    wallArea: squareMetres(wallArea),
    facadeArea: squareMetres(wallArea - allOpenings),
    roofArea: squareMetres(roofSlope * roofWidth),
    roofInsulationArea: squareMetres(insulatedSlope * roof.length),
    windowArea: squareMetres(openingArea((item) => item.opening.type === 'window')),
    panoramicWindowArea: squareMetres(openingArea((item) => item.opening.panoramic)),
    windowCount: windows.length,
    exteriorDoorCount: openings.length - windows.length,
    interiorDoorCount: spec.doors.length,
    terraceArea: terrace === null ? 0 : squareMetres(terrace.length * terrace.depth),
    pileCount:
      gridPiles(spec.width, spec.depth, standards.pileSpacing) +
      (terrace === null ? 0 : gridPiles(terrace.length, terrace.depth, standards.pileSpacing)),
    perimeter: roundTo(toMetres(2 * (spec.width + spec.depth)), AREA_DECIMALS),
    wetZoneCount: spec.rooms.filter((room) => traitsOf(rooms, room.kind).wetZone).length,
    chimneyCount: frame.chimney === null ? 0 : 1,
  }
}
