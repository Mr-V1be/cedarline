import type { RoomDesign } from '../spec/design'
import type { HouseSpec } from '../spec/house-spec'
import { roundTo, toSquareMetres } from '../units'

export interface NetRect {
  readonly x0: number
  readonly y0: number
  readonly x1: number
  readonly y1: number
}

/**
 * Clear (net) rectangle of a room: edges on the outer contour move in by the exterior wall
 * thickness, edges on partition axes move in by half a partition.
 */
export function netRoomRect(
  spec: Pick<HouseSpec, 'width' | 'depth' | 'wallThickness' | 'standards'>,
  room: RoomDesign,
): NetRect {
  const halfPartition = spec.standards.partitionThickness / 2
  const wall = spec.wallThickness
  const inset = (edge: number, outerEdge: number, direction: 1 | -1) =>
    edge === outerEdge ? outerEdge + direction * wall : edge + direction * halfPartition
  return {
    x0: inset(room.x, 0, 1),
    y0: inset(room.y, 0, 1),
    x1: inset(room.x + room.width, spec.width, -1),
    y1: inset(room.y + room.depth, spec.depth, -1),
  }
}

/** Net room area in m², rounded to 0.01 m² as on drawings. */
export function netRoomArea(spec: Parameters<typeof netRoomRect>[0], room: RoomDesign): number {
  const rect = netRoomRect(spec, room)
  return roundTo(toSquareMetres(Math.max(0, rect.x1 - rect.x0) * Math.max(0, rect.y1 - rect.y0)), 2)
}
