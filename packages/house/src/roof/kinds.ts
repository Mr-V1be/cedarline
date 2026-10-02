import { degreesToRadians, type Vec2 } from '../units'
import type { RoofProfile } from './profile'

export interface PitchRange {
  readonly min: number
  readonly max: number
  readonly default: number
}

/**
 * Roof kind strategy. Every kind supported today is prismatic, so a kind is described by its
 * cross-section profile; the frame, mesh, takeoff and plan code never branch on the key.
 */
export interface RoofKind {
  readonly key: string
  readonly pitch: PitchRange
  /** Whether a habitable attic (мансарда) fits under this roof. */
  readonly supportsAttic: boolean
  /** Knee wall of the attic under this roof, mm; steep lower slopes need a lower wall. */
  readonly atticKneeWall?: number
  profile(span: number, pitchDegrees: number): RoofProfile
}

const slope = (pitchDegrees: number): number => Math.tan(degreesToRadians(pitchDegrees))

const gable: RoofKind = {
  key: 'gable',
  pitch: { min: 15, max: 45, default: 30 },
  supportsAttic: true,
  profile(span, pitchDegrees) {
    const half = span / 2
    return {
      span,
      points: [
        [0, 0],
        [half, half * slope(pitchDegrees)],
        [span, 0],
      ],
    }
  },
}

/** Single slope rising towards s = span, which gives one tall facade for panoramic glazing. */
const shed: RoofKind = {
  key: 'shed',
  pitch: { min: 5, max: 20, default: 10 },
  supportsAttic: false,
  profile(span, pitchDegrees) {
    return {
      span,
      points: [
        [0, 0],
        [span, span * slope(pitchDegrees)],
      ],
    }
  },
}

/** Steep lower slope, then a shallow upper slope (ломаная мансардная кровля). */
const GAMBREL_LOWER_PITCH = 60
/** Horizontal run of the steep lower slope as a share of the span. */
const GAMBREL_BREAK_SHARE = 0.18

const gambrel: RoofKind = {
  key: 'gambrel',
  pitch: { min: 15, max: 35, default: 25 },
  supportsAttic: true,
  atticKneeWall: 400,
  profile(span, pitchDegrees) {
    const half = span / 2
    const run = span * GAMBREL_BREAK_SHARE
    const breakHeight = run * slope(GAMBREL_LOWER_PITCH)
    const ridgeHeight = breakHeight + (half - run) * slope(pitchDegrees)
    const points: Vec2[] = [
      [0, 0],
      [run, breakHeight],
      [half, ridgeHeight],
      [span - run, breakHeight],
      [span, 0],
    ]
    return { span, points }
  },
}

/** Registry of roof kinds; adding a kind is adding an entry here. */
export const ROOF_KINDS = { gable, shed, gambrel } as const satisfies Record<string, RoofKind>
export type RoofKindKey = keyof typeof ROOF_KINDS
export const ROOF_KIND_KEYS = Object.keys(ROOF_KINDS) as RoofKindKey[]

export const isRoofKindKey = (value: string): value is RoofKindKey => value in ROOF_KINDS
