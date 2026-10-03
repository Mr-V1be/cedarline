'use client'

import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  N8AO,
  ToneMapping,
} from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { HalfFloatType } from 'three'

import type { ScenePreset } from './presets'
import type { QualityTier } from './quality'

/** Screen-space effects, metres: ambient occlusion everywhere it is affordable. */
const AO = { radius: 1.1, distanceFalloff: 0.6, intensity: 2.2 } as const
/**
 * Bloom works on the HDR image and only above 1.0, so it catches lit windows and the porch
 * lamp but never a white facade or the sky.
 */
const BLOOM = { threshold: 1, smoothing: 0.08, intensity: 0.55, radius: 0.55 } as const
/** A touch less colour than the raw render: architectural photography, not a game. */
const SATURATION = -0.08
/** AgX is flat by design; a little contrast gives it the bite of a photograph. */
const CONTRAST = 0.12

/** Tone mapping of the scene; renders without post-processing use the same curve. */
const SCENE_TONE_MAPPING = ToneMappingMode.AGX

export function SceneEffects({
  quality,
  preset,
}: {
  readonly quality: QualityTier
  readonly preset: ScenePreset
}) {
  if (!quality.ambientOcclusion) return null
  const bloom = quality.bloom && preset.windowGlow !== null
  return (
    <EffectComposer
      multisampling={quality.multisampling}
      enableNormalPass={false}
      frameBufferType={HalfFloatType}
    >
      <N8AO
        aoRadius={AO.radius}
        distanceFalloff={AO.distanceFalloff}
        intensity={AO.intensity}
        halfRes={quality.multisampling < 8}
      />
      {bloom ? (
        <Bloom
          luminanceThreshold={BLOOM.threshold}
          luminanceSmoothing={BLOOM.smoothing}
          intensity={BLOOM.intensity}
          radius={BLOOM.radius}
          mipmapBlur
        />
      ) : (
        <></>
      )}
      <HueSaturation saturation={SATURATION} />
      <BrightnessContrast contrast={CONTRAST} />
      <ToneMapping mode={SCENE_TONE_MAPPING} />
    </EffectComposer>
  )
}
