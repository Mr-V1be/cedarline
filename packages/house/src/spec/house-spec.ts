import type { RoofKind } from '../roof/kinds'
import type {
  ChimneyDesign,
  InteriorDoorDesign,
  OpeningDesign,
  RidgeAxis,
  RoomDesign,
  TerraceDesign,
  WallSide,
} from './design'
import type { FacadeFinish, WindowStyle } from './options'
import type { ConstructionStandards } from './standards'

/** An opening after the window style has been applied. */
export interface ResolvedOpening extends OpeningDesign {
  readonly panoramic: boolean
}

/** A design combined with options and standards: the single input of every derived model. */
export interface HouseSpec {
  readonly width: number
  readonly depth: number
  readonly storeys: number
  readonly attic: boolean
  readonly storeyHeight: number
  readonly ridgeAxis: RidgeAxis
  readonly roofKind: RoofKind
  readonly roofPitch: number
  readonly facadeFinish: FacadeFinish
  readonly facadeColor: string
  readonly windowStyle: WindowStyle
  readonly insulation: number
  readonly wallThickness: number
  readonly kneeWallHeight: number
  readonly rooms: readonly RoomDesign[]
  readonly openings: readonly ResolvedOpening[]
  readonly doors: readonly InteriorDoorDesign[]
  readonly terrace: TerraceDesign | null
  readonly chimney: ChimneyDesign | null
  readonly standards: ConstructionStandards
}

export const levelCount = (spec: Pick<HouseSpec, 'storeys' | 'attic'>): number =>
  spec.storeys + (spec.attic ? 1 : 0)

export const isAtticLevel = (spec: Pick<HouseSpec, 'storeys' | 'attic'>, level: number): boolean =>
  spec.attic && level === spec.storeys

export const wallLength = (spec: Pick<HouseSpec, 'width' | 'depth'>, side: WallSide): number =>
  side === 'front' || side === 'back' ? spec.width : spec.depth
