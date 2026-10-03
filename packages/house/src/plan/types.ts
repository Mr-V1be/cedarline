import type { DoorOrientation, OpeningType, WallSide } from '../spec/design'
import type { RoomKindTraits } from '../spec/room-traits'
import type { LandingKind } from '../frame/types'
import type { NetRect } from '../takeoff/rooms'
import type { Rect } from '../units'

export type PlanRect = Rect

/** Terrace or porch on the ground-floor plan, with its flight of steps. */
export interface PlanDeck {
  readonly kind: LandingKind
  readonly rect: PlanRect
  /** Flight of steps; null when the deck is low enough to need none. */
  readonly stair: PlanRect | null
  readonly steps: number
  /** Which way the steps lead away from the house. */
  readonly side: WallSide
}

export interface PlanRoom {
  readonly id: string
  readonly kind: string
  readonly traits: RoomKindTraits
  /** Rectangle on the wall axes grid, as authored. */
  readonly axes: PlanRect
  /** Clear rectangle inside walls and partitions. */
  readonly net: NetRect
  readonly area: number
}

export interface PlanOpening {
  readonly id: string
  readonly type: OpeningType
  readonly side: WallSide
  readonly panoramic: boolean
  /** Footprint of the opening across the wall thickness. */
  readonly rect: PlanRect
}

export interface PlanDoor {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly width: number
  readonly orientation: DoorOrientation
}

export const DIMENSION_SIDES = ['top', 'right', 'bottom', 'left'] as const
export type DimensionSide = (typeof DIMENSION_SIDES)[number]

/** A chain of dimension marks along one side; tier 0 is closest to the drawing. */
export interface DimensionChain {
  readonly side: DimensionSide
  readonly tier: number
  /** Positions along x (top, bottom) or y (left, right), ascending, in mm. */
  readonly marks: readonly number[]
}

export interface FloorPlan {
  readonly level: number
  readonly attic: boolean
  readonly width: number
  readonly depth: number
  readonly wallThickness: number
  readonly partitionThickness: number
  readonly rooms: readonly PlanRoom[]
  readonly openings: readonly PlanOpening[]
  readonly doors: readonly PlanDoor[]
  /** Terrace and porches; only the ground floor has them. */
  readonly decks: readonly PlanDeck[]
  readonly chimney: { readonly x: number; readonly y: number; readonly diameter: number } | null
  readonly dimensions: readonly DimensionChain[]
  readonly totalArea: number
}
