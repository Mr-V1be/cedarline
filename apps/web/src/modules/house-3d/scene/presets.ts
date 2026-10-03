import generated from './assets/generated.json'

export type SkyKey = keyof typeof generated.skies

/**
 * Lighting moods of the scene. Every preset is a sky (HDRI for light, image for the
 * background) plus how the house itself is lit: day relies on the sun, evening on warm light
 * from the windows and a porch lamp.
 */
export interface ScenePreset {
  readonly sky: SkyKey
  readonly environmentIntensity: number
  readonly exposure: number
  readonly sun: { readonly color: string; readonly intensity: number }
  /** Fog density relative to the scene size: distant trees fade into the horizon colour. */
  readonly haze: { readonly near: number; readonly far: number; readonly tint: number }
  /** Light from the rooms in HDR units (above 1.0 blooms), or none in daylight. */
  readonly windowGlow: { readonly color: string; readonly intensity: number } | null
  readonly porchLight: { readonly color: string; readonly intensity: number } | null
}

export const SCENE_PRESETS = {
  day: {
    sky: 'day',
    environmentIntensity: 1.1,
    exposure: 1.2,
    sun: { color: '#fff3e0', intensity: 3.4 },
    haze: { near: 5.5, far: 32, tint: 0.1 },
    windowGlow: null,
    porchLight: null,
  },
  evening: {
    sky: 'evening',
    environmentIntensity: 0.35,
    exposure: 1.1,
    sun: { color: '#ffae70', intensity: 1.5 },
    haze: { near: 3.5, far: 20, tint: 0 },
    windowGlow: { color: '#ffc27a', intensity: 2.2 },
    porchLight: { color: '#ffb36b', intensity: 14 },
  },
} as const satisfies Record<string, ScenePreset>

export type ScenePresetKey = keyof typeof SCENE_PRESETS
export const SCENE_PRESET_KEYS = Object.keys(SCENE_PRESETS) as ScenePresetKey[]
export const isScenePresetKey = (value: string): value is ScenePresetKey => value in SCENE_PRESETS

/** The sun stands front-left of the house, so facades are lit and shadows fall where cameras look. */
const SUN_AZIMUTH = Math.atan2(-0.55, 0.95)

export interface SkyLighting {
  /** Rotation of the sky around the vertical axis that puts its sun where the scene wants it. */
  readonly rotation: number
  /** Unit vector towards the sun after rotation. */
  readonly sunDirection: readonly [number, number, number]
  readonly horizon: string
}

export function skyLighting(key: SkyKey): SkyLighting {
  const sky = generated.skies[key]
  const [x, y, z] = sky.sun as [number, number, number]
  const rotation = SUN_AZIMUTH - Math.atan2(x, z)
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  return {
    rotation,
    sunDirection: [x * cos + z * sin, y, -x * sin + z * cos],
    horizon: sky.horizon,
  }
}
