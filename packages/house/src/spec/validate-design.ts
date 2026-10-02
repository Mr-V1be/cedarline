import { HouseError } from '../errors'
import type { HouseDesign, RoomDesign } from './design'
import { wallLength } from './house-spec'

/** Building-code sanity bound: the factory produces houses of up to three storeys. */
export const MAX_STOREYS = 3

function assertPositiveLength(value: number, field: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new HouseError('INVALID_DIMENSION', `${field} must be a positive length`, {
      field,
      value,
    })
  }
}

function assertLevel(level: number, levels: number, owner: string) {
  if (!Number.isInteger(level) || level < 0 || level >= levels) {
    throw new HouseError(
      'UNKNOWN_LEVEL',
      `${owner} is on level ${level}, the house has ${levels}`,
      {
        owner,
        level,
      },
    )
  }
}

const roomsOverlap = (a: RoomDesign, b: RoomDesign): boolean =>
  a.level === b.level &&
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.depth &&
  b.y < a.y + a.depth

/** Invariants of an authored design that do not depend on the selected options. */
export function validateDesign(design: HouseDesign): HouseDesign {
  assertPositiveLength(design.width, 'width')
  assertPositiveLength(design.depth, 'depth')
  assertPositiveLength(design.storeyHeight, 'storeyHeight')
  if (!Number.isInteger(design.storeys) || design.storeys < 1 || design.storeys > MAX_STOREYS) {
    throw new HouseError('INVALID_DIMENSION', `storeys must be from 1 to ${MAX_STOREYS}`, {
      storeys: design.storeys,
    })
  }
  const levels = design.storeys + (design.attic ? 1 : 0)

  const ids = [...design.rooms, ...design.openings, ...design.doors].map((item) => item.id)
  const duplicate = ids.find((id, index) => ids.indexOf(id) !== index)
  if (duplicate !== undefined) {
    throw new HouseError('DUPLICATE_ID', `Duplicate element id "${duplicate}"`, { id: duplicate })
  }

  design.rooms.forEach((room, index) => {
    const owner = `room ${room.id}`
    assertLevel(room.level, levels, owner)
    assertPositiveLength(room.width, `${owner}.width`)
    assertPositiveLength(room.depth, `${owner}.depth`)
    const inside =
      room.x >= 0 &&
      room.y >= 0 &&
      room.x + room.width <= design.width &&
      room.y + room.depth <= design.depth
    if (!inside) {
      throw new HouseError('ROOM_OUT_OF_BOUNDS', `${owner} lies outside the footprint`, {
        id: room.id,
      })
    }
    const clash = design.rooms.slice(index + 1).find((other) => roomsOverlap(room, other))
    if (clash !== undefined) {
      throw new HouseError('ROOMS_OVERLAP', `${owner} overlaps room ${clash.id}`, {
        id: room.id,
        other: clash.id,
      })
    }
  })

  for (const door of design.doors) {
    assertLevel(door.level, levels, `door ${door.id}`)
    assertPositiveLength(door.width, `door ${door.id}.width`)
  }

  for (const opening of design.openings) {
    const owner = `opening ${opening.id}`
    assertLevel(opening.level, levels, owner)
    assertPositiveLength(opening.width, `${owner}.width`)
    assertPositiveLength(opening.height, `${owner}.height`)
    if (opening.offset < 0 || opening.sill < 0) {
      throw new HouseError('OPENING_OUT_OF_WALL', `${owner} has a negative offset or sill`, {
        id: opening.id,
      })
    }
  }

  if (design.terrace !== null) {
    const { terrace } = design
    assertPositiveLength(terrace.length, 'terrace.length')
    assertPositiveLength(terrace.depth, 'terrace.depth')
    if (terrace.offset < 0 || terrace.offset + terrace.length > wallLength(design, terrace.side)) {
      throw new HouseError('TERRACE_OUT_OF_WALL', 'Terrace does not fit along its wall', {
        side: terrace.side,
      })
    }
  }

  if (design.chimney !== null) {
    const { x, y } = design.chimney
    if (x <= 0 || y <= 0 || x >= design.width || y >= design.depth) {
      throw new HouseError('INVALID_DIMENSION', 'Chimney must stand inside the footprint', { x, y })
    }
  }

  return design
}
