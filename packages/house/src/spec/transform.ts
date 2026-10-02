import type { HouseDesign, OpeningDesign, WallSide } from './design'
import { wallLength } from './house-spec'

/** Lengths are rounded to the factory module after scaling. */
const MODULE = 10

const snap = (value: number) => Math.round(value / MODULE) * MODULE

const isAlongWidth = (side: WallSide) => side === 'front' || side === 'back'

/**
 * Resizes a design to new outer dimensions. Rooms keep their proportions on the axis grid;
 * windows and doors keep their size and stay centred where they were along their wall; the
 * terrace and the chimney follow the walls they belong to.
 */
export function resizeDesign(design: HouseDesign, width: number, depth: number): HouseDesign {
  const sx = width / design.width
  const sy = depth / design.depth
  const ratio = (side: WallSide) => (isAlongWidth(side) ? sx : sy)
  const moveOpening = (opening: OpeningDesign): OpeningDesign => {
    const centre = (opening.offset + opening.width / 2) * ratio(opening.side)
    return { ...opening, offset: snap(centre - opening.width / 2) }
  }
  return {
    ...design,
    width,
    depth,
    rooms: design.rooms.map((room) => {
      const x0 = snap(room.x * sx)
      const y0 = snap(room.y * sy)
      return {
        ...room,
        x: x0,
        y: y0,
        width: snap((room.x + room.width) * sx) - x0,
        depth: snap((room.y + room.depth) * sy) - y0,
      }
    }),
    openings: design.openings.map(moveOpening),
    doors: design.doors.map((door) => ({ ...door, x: snap(door.x * sx), y: snap(door.y * sy) })),
    terrace:
      design.terrace === null
        ? null
        : {
            ...design.terrace,
            offset: snap(design.terrace.offset * ratio(design.terrace.side)),
            length: snap(design.terrace.length * ratio(design.terrace.side)),
          },
    chimney:
      design.chimney === null
        ? null
        : { x: snap(design.chimney.x * sx), y: snap(design.chimney.y * sy) },
  }
}

const MIRRORED_SIDE: Readonly<Record<WallSide, WallSide>> = {
  front: 'front',
  back: 'back',
  left: 'right',
  right: 'left',
}

/** Mirror image across the vertical axis of the front facade (зеркальная планировка). */
export function mirrorDesign(design: HouseDesign): HouseDesign {
  return {
    ...design,
    rooms: design.rooms.map((room) => ({ ...room, x: design.width - room.x - room.width })),
    openings: design.openings.map((opening) => {
      const side = MIRRORED_SIDE[opening.side]
      // Along the front and back walls the order of openings reverses; a side wall changes
      // sides, and measured from its own left end the same position mirrors the same way.
      return { ...opening, side, offset: wallLength(design, side) - opening.offset - opening.width }
    }),
    doors: design.doors.map((door) => ({ ...door, x: design.width - door.x })),
    terrace:
      design.terrace === null
        ? null
        : {
            ...design.terrace,
            side: MIRRORED_SIDE[design.terrace.side],
            offset:
              wallLength(design, design.terrace.side) -
              design.terrace.offset -
              design.terrace.length,
          },
    chimney:
      design.chimney === null ? null : { x: design.width - design.chimney.x, y: design.chimney.y },
  }
}
