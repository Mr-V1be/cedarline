import type {
  DoorOrientation,
  FacadeFinish,
  RidgeAxis,
  RoofKindKey,
  WallSide,
  WindowRole,
  WindowStyle,
} from '@kedrovnik/house'

import type { Localized } from '../localized'

export interface RoomSeed {
  readonly key: string
  readonly kind: string
  readonly level: number
  readonly x: number
  readonly y: number
  readonly width: number
  readonly depth: number
}

export interface OpeningSeed {
  readonly key: string
  readonly type: 'window' | 'door'
  readonly role: WindowRole
  readonly side: WallSide
  readonly level: number
  readonly offset: number
  readonly width: number
  readonly height: number
  readonly sill: number
}

export interface DoorSeed {
  readonly key: string
  readonly level: number
  readonly x: number
  readonly y: number
  readonly width: number
  readonly orientation: DoorOrientation
}

export interface ProjectSeed {
  readonly slug: string
  readonly type: string
  readonly sortOrder: number
  readonly title: Localized
  readonly summary: Localized
  readonly design: {
    readonly width: number
    readonly depth: number
    readonly storeys: number
    readonly attic: boolean
    readonly storeyHeight: number
    readonly ridgeAxis: RidgeAxis
    readonly rooms: readonly RoomSeed[]
    readonly openings: readonly OpeningSeed[]
    readonly doors: readonly DoorSeed[]
    readonly terrace: {
      readonly side: WallSide
      readonly offset: number
      readonly length: number
      readonly depth: number
    } | null
    readonly chimney: { readonly x: number; readonly y: number } | null
  }
  readonly defaults: {
    readonly roofKind: RoofKindKey
    readonly roofPitch: number
    readonly facadeFinish: FacadeFinish
    readonly facadeColor: string
    readonly windowStyle: WindowStyle
    readonly insulation: number
    readonly engineering: readonly string[]
  }
}

/** Joinery sizes used across the catalog, mm. */
const SIZES = {
  standard: { height: 1400, sill: 850 },
  view: { height: 1600, sill: 700 },
  small: { width: 600, height: 600, sill: 1500 },
  door: { width: 1000, height: 2100 },
} as const

/**
 * Authoring helper: rooms by corners and openings by their plan position along the wall, so
 * layouts read like a drawing. Offsets along each wall are derived from the plan.
 */
export function plan(width: number, depth: number) {
  const offsetOf = (side: WallSide, start: number, size: number) =>
    side === 'front' || side === 'left' ? start : (side === 'back' ? width : depth) - start - size

  return {
    room: (
      key: string,
      kind: string,
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      level = 0,
    ): RoomSeed => ({
      key,
      kind,
      level,
      x: x0,
      y: y0,
      width: x1 - x0,
      depth: y1 - y0,
    }),
    window: (
      key: string,
      side: WallSide,
      start: number,
      size: number,
      options: { role?: WindowRole; level?: number; height?: number; sill?: number } = {},
    ): OpeningSeed => {
      const role = options.role ?? 'standard'
      const preset = role === 'view' ? SIZES.view : SIZES.standard
      return {
        key,
        type: 'window',
        role,
        side,
        level: options.level ?? 0,
        offset: offsetOf(side, start, size),
        width: size,
        height: options.height ?? preset.height,
        sill: options.sill ?? preset.sill,
      }
    },
    small: (key: string, side: WallSide, start: number, level = 0): OpeningSeed => ({
      key,
      type: 'window',
      role: 'standard',
      side,
      level,
      offset: offsetOf(side, start, SIZES.small.width),
      width: SIZES.small.width,
      height: SIZES.small.height,
      sill: SIZES.small.sill,
    }),
    entrance: (
      key: string,
      side: WallSide,
      start: number,
      height: number = SIZES.door.height,
    ): OpeningSeed => ({
      key,
      type: 'door',
      role: 'standard',
      side,
      level: 0,
      offset: offsetOf(side, start, SIZES.door.width),
      width: SIZES.door.width,
      height,
      sill: 0,
    }),
    door: (
      key: string,
      x: number,
      y: number,
      orientation: DoorOrientation,
      size = 800,
      level = 0,
    ): DoorSeed => ({
      key,
      level,
      x,
      y,
      width: size,
      orientation,
    }),
  }
}
