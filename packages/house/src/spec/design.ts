/**
 * Architectural design of a project as authored in the catalog. All lengths are millimetres.
 *
 * Plan coordinates: x runs along the width from the left outer corner, y runs along the depth
 * from the back outer wall (top of the drawing) to the front facade (bottom of the drawing).
 */

/** Exterior wall sides, named as seen from the front of the house. */
export const WALL_SIDES = ['front', 'right', 'back', 'left'] as const
export type WallSide = (typeof WALL_SIDES)[number]

export const OPENING_TYPES = ['window', 'door'] as const
export type OpeningType = (typeof OPENING_TYPES)[number]

/** `view` windows become floor-length glazing when the panoramic window style is chosen. */
export const WINDOW_ROLES = ['view', 'standard'] as const
export type WindowRole = (typeof WINDOW_ROLES)[number]

export const RIDGE_AXES = ['x', 'y'] as const
export type RidgeAxis = (typeof RIDGE_AXES)[number]

export const DOOR_ORIENTATIONS = ['horizontal', 'vertical'] as const
export type DoorOrientation = (typeof DOOR_ORIENTATIONS)[number]

/** A room rectangle on the outer-wall grid: shared edges are partition axes. */
export interface RoomDesign {
  readonly id: string
  /** Room kind key; its traits (bedroom, wet zone, stair) come from the room kind catalog. */
  readonly kind: string
  readonly level: number
  readonly x: number
  readonly y: number
  readonly width: number
  readonly depth: number
}

/** A window or exterior door. `offset` is measured from the wall's left end seen from outside. */
export interface OpeningDesign {
  readonly id: string
  readonly type: OpeningType
  readonly role: WindowRole
  readonly side: WallSide
  readonly level: number
  readonly offset: number
  readonly width: number
  readonly height: number
  /** Height of the opening bottom above the level's finished floor. */
  readonly sill: number
  /** Width used by the panoramic window style; defaults to `width`. */
  readonly panoramicWidth?: number
}

/** Interior door centred at (x, y) on a partition axis. */
export interface InteriorDoorDesign {
  readonly id: string
  readonly level: number
  readonly x: number
  readonly y: number
  readonly width: number
  readonly orientation: DoorOrientation
}

/** Open deck along one wall; depth is the default that the configurator may change. */
export interface TerraceDesign {
  readonly side: WallSide
  readonly offset: number
  readonly length: number
  readonly depth: number
}

export interface ChimneyDesign {
  readonly x: number
  readonly y: number
}

export interface HouseDesign {
  readonly width: number
  readonly depth: number
  /** Full-height storeys (1 or more). */
  readonly storeys: number
  /** Habitable attic level above the storeys (мансарда). */
  readonly attic: boolean
  /** Clear floor-to-ceiling height of a storey. */
  readonly storeyHeight: number
  /** Plan axis the ridge runs along. */
  readonly ridgeAxis: RidgeAxis
  readonly rooms: readonly RoomDesign[]
  readonly openings: readonly OpeningDesign[]
  readonly doors: readonly InteriorDoorDesign[]
  readonly terrace: TerraceDesign | null
  readonly chimney: ChimneyDesign | null
}
