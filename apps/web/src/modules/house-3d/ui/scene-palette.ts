import type { FacadeFinish } from '@kedrovnik/house'

/**
 * Colours of the 3D scene: the scene's own token set. Facade colours come from the catalog;
 * everything else is the factory's standard material palette.
 */
export const SCENE_PALETTE = {
  roof: '#2f3432',
  roofTrim: '#3b403d',
  plinth: '#4b4f4c',
  frame: '#2a2e2c',
  glass: '#22313a',
  interior: '#e9dfcc',
  floor: '#c7a57d',
  door: '#3f3129',
  metal: '#555b57',
  deck: '#a98559',
  sunLight: '#fff4e2',
  skyLight: '#eef3f6',
  groundLight: '#6f6a5c',
  shadow: '#1d2320',
} as const

/** Trim boards are a shade off the facade so corners and reveals read as separate pieces. */
export const TRIM_SHADE: Readonly<Record<FacadeFinish, number>> = {
  'timber-imitation': -0.08,
  planken: 0.1,
  'fiber-cement': -0.12,
}
