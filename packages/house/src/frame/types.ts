import type { RoofKind } from '../roof/kinds'
import type { RoofProfile } from '../roof/profile'
import type { RidgeAxis, WallSide } from '../spec/design'
import type { HouseSpec, ResolvedOpening } from '../spec/house-spec'
import type { Rect, Vec2 } from '../units'
import type { WallPlacement } from './placement'

export interface LevelFrame {
  readonly index: number
  readonly attic: boolean
  /** Finished floor elevation above grade, mm. */
  readonly floor: number
  /** Ceiling elevation; for the attic level it is the ridge. */
  readonly ceiling: number
}

export interface OpeningFrame {
  readonly opening: ResolvedOpening
  readonly u0: number
  readonly u1: number
  readonly v0: number
  readonly v1: number
}

export interface WallFrame extends WallPlacement {
  /** Outer face outline in (u, v): v is the absolute elevation, counter-clockwise. */
  readonly polygon: readonly Vec2[]
  readonly openings: readonly OpeningFrame[]
  /** The wall runs across the roof span, so its top follows the roof profile (a gable). */
  readonly gable: boolean
}

export interface RoofFrame {
  readonly kind: RoofKind
  readonly pitch: number
  readonly ridgeAxis: RidgeAxis
  readonly span: number
  readonly length: number
  readonly profile: RoofProfile
  /** Elevation of the wall tops where the roof underside starts. */
  readonly eaveBase: number
  readonly ridgeElevation: number
  readonly eaveOverhang: number
  readonly gableOverhang: number
  readonly thickness: number
}

/** Flight of steps from a landing's outer edge down to the ground. */
export interface StairFrame {
  /** Span along the wall's outer face, as for openings. */
  readonly u0: number
  readonly u1: number
  /** Treads below the deck; the flight has one riser more. */
  readonly steps: number
  readonly riser: number
  readonly tread: number
  /** Distance from the wall face to the foot of the flight, where the path begins. */
  readonly foot: number
  /** Plan rectangle of the flight; empty along the depth when the deck needs no steps. */
  readonly rect: Rect
}

export const LANDING_KINDS = ['terrace', 'porch'] as const
export type LandingKind = (typeof LANDING_KINDS)[number]

/** Deck an exterior door opens onto: the terrace or a porch (крыльцо), with its steps. */
export interface LandingFrame {
  readonly kind: LandingKind
  readonly side: WallSide
  /** Span along the wall's outer face, as for openings. */
  readonly u0: number
  readonly u1: number
  readonly depth: number
  readonly deckTop: number
  /** Plan rectangle of the deck. */
  readonly rect: Rect
  /** Ids of the exterior doors that open onto the deck; the first one leads its steps. */
  readonly doors: readonly string[]
  readonly stair: StairFrame
}

export interface ChimneyFrame {
  readonly x: number
  readonly y: number
  readonly base: number
  readonly top: number
  readonly diameter: number
}

/** Analytic shapes derived from a spec; geometry, takeoff and plans are computed from it. */
export interface HouseFrame {
  readonly spec: HouseSpec
  readonly levels: readonly LevelFrame[]
  readonly walls: readonly WallFrame[]
  readonly roof: RoofFrame
  /** Terrace and porches, one landing per entrance or group of entrances. */
  readonly landings: readonly LandingFrame[]
  readonly chimney: ChimneyFrame | null
}

export const terraceOf = (frame: Pick<HouseFrame, 'landings'>): LandingFrame | null =>
  frame.landings.find((landing) => landing.kind === 'terrace') ?? null
