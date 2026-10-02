import type { RoofKindKey } from '../roof/kinds'

/**
 * Facade finishes the renderer and the takeoff understand. The catalog decides which of them
 * are offered, their names, colours and prices.
 */
export const FACADE_FINISHES = ['timber-imitation', 'planken', 'fiber-cement'] as const
export type FacadeFinish = (typeof FACADE_FINISHES)[number]

export const WINDOW_STYLES = ['standard', 'panoramic'] as const
export type WindowStyle = (typeof WINDOW_STYLES)[number]

/** Customer-selectable options that change the geometry of the house. */
export interface HouseOptions {
  readonly roofKind: RoofKindKey
  /** Main roof pitch in degrees; the kind's default applies when omitted. */
  readonly roofPitch?: number
  readonly facadeFinish: FacadeFinish
  /** Facade colour as #rrggbb, chosen from the catalog palette of the finish. */
  readonly facadeColor: string
  readonly windowStyle: WindowStyle
  /** Insulation thickness of exterior walls, mm. */
  readonly insulation: number
  /** Terrace depth in mm; `null` removes the terrace, omitted keeps the design default. */
  readonly terraceDepth?: number | null
}

export const isFacadeFinish = (value: string): value is FacadeFinish =>
  (FACADE_FINISHES as readonly string[]).includes(value)

export const isWindowStyle = (value: string): value is WindowStyle =>
  (WINDOW_STYLES as readonly string[]).includes(value)
