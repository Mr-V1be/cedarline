import type { HouseDesign, OpeningDesign, TerraceDesign, TerraceReach, WallSide } from './design'
import { wallLength } from './house-spec'

/** Lengths are rounded to the factory module after scaling. */
const MODULE = 10

const snap = (value: number) => Math.round(value / MODULE) * MODULE

const isAlongWidth = (side: WallSide) => side === 'front' || side === 'back'

/** The terrace keeps its share of the entrance wall, within the wall's new length. */
function resizeTerrace(
  design: HouseDesign,
  terrace: TerraceDesign,
  footprint: Pick<HouseDesign, 'width' | 'depth'>,
): TerraceDesign {
  const side = design.openings.find((opening) => opening.id === terrace.entrance)?.side ?? 'front'
  const ratio = wallLength(footprint, side) / wallLength(design, side)
  return {
    ...terrace,
    length: Math.min(snap(terrace.length * ratio), wallLength(footprint, side)),
  }
}

/**
 * Resizes a design to new outer dimensions. Rooms keep their proportions on the axis grid;
 * windows and doors keep their size and stay centred where they were along their wall; the
 * terrace follows its entrance and the chimney its place on the plan.
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
      design.terrace === null ? null : resizeTerrace(design, design.terrace, { width, depth }),
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

const MIRRORED_REACH: Readonly<Record<TerraceReach, TerraceReach>> = {
  left: 'right',
  right: 'left',
  both: 'both',
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
    // The terrace follows its door, which has moved; only the way it extends swaps.
    terrace:
      design.terrace === null
        ? null
        : { ...design.terrace, reach: MIRRORED_REACH[design.terrace.reach] },
    chimney:
      design.chimney === null ? null : { x: design.width - design.chimney.x, y: design.chimney.y },
  }
}
