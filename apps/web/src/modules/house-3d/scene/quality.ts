/**
 * Rendering budgets. `still` renders catalog images offline; `high` and `low` are chosen for the
 * visitor's device and `low` is also the fallback when frame rate drops.
 */
import type { TextureTier } from './assets'

export interface QualityTier {
  readonly dpr: number | readonly [number, number]
  readonly textures: TextureTier
  /** Trees throw shadows (cheap proxies, but one more shadow pass per tree kind). */
  readonly treeShadows: boolean
  readonly shadowMapSize: number
  readonly ambientOcclusion: boolean
  readonly bloom: boolean
  readonly multisampling: number
  readonly trees: number
}

export const QUALITY_TIERS = {
  still: {
    dpr: 1,
    textures: 'still',
    treeShadows: true,
    shadowMapSize: 4096,
    ambientOcclusion: true,
    bloom: true,
    multisampling: 8,
    trees: 620,
  },
  high: {
    dpr: [1, 1.75],
    textures: 'high',
    treeShadows: true,
    shadowMapSize: 2048,
    ambientOcclusion: true,
    bloom: true,
    multisampling: 4,
    trees: 380,
  },
  low: {
    dpr: [1, 1.25],
    textures: 'low',
    treeShadows: false,
    shadowMapSize: 1024,
    ambientOcclusion: false,
    bloom: false,
    multisampling: 0,
    trees: 170,
  },
} as const satisfies Record<string, QualityTier>

export type QualityKey = keyof typeof QUALITY_TIERS

/** Phones, tablets and modest hardware start at `low`; capable desktops at `high`. */
const CAPABLE_QUERY = '(min-width: 1024px) and (pointer: fine)'
const MIN_CORES = 6

export function detectQuality(): Exclude<QualityKey, 'still'> {
  if (typeof window === 'undefined') return 'low'
  const cores = navigator.hardwareConcurrency
  return window.matchMedia(CAPABLE_QUERY).matches && cores >= MIN_CORES ? 'high' : 'low'
}
