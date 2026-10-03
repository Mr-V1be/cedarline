import type { FacadeFinish } from '@kedrovnik/house'

import type { MaterialKey } from './assets'

/**
 * Colours of the factory's standard parts. Facade colours come from the catalog; these are
 * the scene's own tokens for everything else.
 */
export const SCENE_PALETTE = {
  roof: '#3b403e',
  roofTrim: '#2f3432',
  frame: '#2b2f2d',
  glass: '#1f2c33',
  interior: '#e8dcc7',
  door: '#4a362a',
  metal: '#5a605c',
  plain: '#ffffff',
  edging: '#3c403d',
} as const

/**
 * Multipliers over the natural textures of the plot, so the lawn reads as a northern
 * meadow rather than turf, the forest floor as needle litter and the paving as light concrete.
 */
export const GROUND_TINTS = {
  grass: '#55683a',
  forestFloor: '#5f6550',
  gravel: '#b5afa3',
  blindArea: '#d9d6cf',
  deck: '#a8906f',
} as const

export interface FinishLook {
  /** Texture set that carries the grain and relief of this finish. */
  readonly texture: MaterialKey
  /** Trim boards are a shade off the facade so corners and reveals read as separate pieces. */
  readonly trimShade: number
  /** Panel joints drawn over the surface, metres; null for boarded finishes. */
  readonly panel: { readonly width: number; readonly height: number } | null
}

/** Exhaustive over the finishes the geometry knows, so a new finish must decide its look. */
export const FINISH_LOOKS: Readonly<Record<FacadeFinish, FinishLook>> = {
  'timber-imitation': { texture: 'timber', trimShade: -0.06, panel: null },
  planken: { texture: 'planken', trimShade: 0.08, panel: null },
  'fiber-cement': { texture: 'plaster', trimShade: -0.1, panel: { width: 1.2, height: 3.05 } },
}
