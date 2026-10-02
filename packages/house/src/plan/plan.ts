import { planPointOnWall } from '../frame/placement'
import type { HouseFrame } from '../frame/types'
import { traitsOf, type RoomKindCatalog } from '../spec/room-traits'
import { netRoomArea, netRoomRect } from '../takeoff/rooms'
import { roundTo } from '../units'
import type { DimensionChain, FloorPlan, PlanOpening, PlanRect, PlanRoom } from './types'

const uniqueSorted = (values: readonly number[]) =>
  [...new Set(values)].sort((left, right) => left - right)

/**
 * Two chains per axis, as on working drawings: partition axes closest to the plan, overall
 * dimension outside. The inner chain is omitted when it would repeat the overall one.
 */
function dimensionChains(
  rooms: readonly PlanRoom[],
  width: number,
  depth: number,
): DimensionChain[] {
  const xs = uniqueSorted([0, width, ...rooms.flatMap((room) => [room.axes.x0, room.axes.x1])])
  const ys = uniqueSorted([0, depth, ...rooms.flatMap((room) => [room.axes.y0, room.axes.y1])])
  const chains: DimensionChain[] = []
  if (xs.length > 2) chains.push({ side: 'bottom', tier: 0, marks: xs })
  chains.push({ side: 'bottom', tier: xs.length > 2 ? 1 : 0, marks: [0, width] })
  if (ys.length > 2) chains.push({ side: 'right', tier: 0, marks: ys })
  chains.push({ side: 'right', tier: ys.length > 2 ? 1 : 0, marks: [0, depth] })
  return chains
}

function rectFrom(a: readonly [number, number], b: readonly [number, number]): PlanRect {
  return {
    x0: Math.min(a[0], b[0]),
    y0: Math.min(a[1], b[1]),
    x1: Math.max(a[0], b[0]),
    y1: Math.max(a[1], b[1]),
  }
}

/** Floor plans of every level, ready to be drawn at any scale. */
export function buildFloorPlans(frame: HouseFrame, catalog: RoomKindCatalog): FloorPlan[] {
  const { spec } = frame
  return frame.levels.map((level): FloorPlan => {
    const rooms: PlanRoom[] = spec.rooms
      .filter((room) => room.level === level.index)
      .map((room) => ({
        id: room.id,
        kind: room.kind,
        traits: traitsOf(catalog, room.kind),
        axes: { x0: room.x, y0: room.y, x1: room.x + room.width, y1: room.y + room.depth },
        net: netRoomRect(spec, room),
        area: netRoomArea(spec, room),
      }))

    const openings: PlanOpening[] = frame.walls.flatMap((wall) =>
      wall.openings
        .filter((item) => item.opening.level === level.index)
        .map((item) => ({
          id: item.opening.id,
          type: item.opening.type,
          side: wall.side,
          panoramic: item.opening.panoramic,
          rect: rectFrom(
            planPointOnWall(wall, item.u0, 0),
            planPointOnWall(wall, item.u1, -spec.wallThickness),
          ),
        })),
    )

    const terrace =
      level.index === 0 && frame.terrace !== null
        ? { x0: frame.terrace.x0, y0: frame.terrace.y0, x1: frame.terrace.x1, y1: frame.terrace.y1 }
        : null

    return {
      level: level.index,
      attic: level.attic,
      width: spec.width,
      depth: spec.depth,
      wallThickness: spec.wallThickness,
      partitionThickness: spec.standards.partitionThickness,
      rooms,
      openings,
      doors: spec.doors.filter((door) => door.level === level.index),
      terrace,
      chimney:
        frame.chimney === null
          ? null
          : { x: frame.chimney.x, y: frame.chimney.y, diameter: frame.chimney.diameter },
      dimensions: dimensionChains(rooms, spec.width, spec.depth),
      totalArea: roundTo(
        rooms.reduce((sum, room) => sum + room.area, 0),
        2,
      ),
    }
  })
}
