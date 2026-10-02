'use client'

import { Bloom, EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

import type { ScenePreset } from './presets'
import type { QualityTier } from './quality'

/** Screen-space effects, metres: ambient occlusion everywhere it is affordable, bloom for lit windows. */
const AO = { radius: 1.1, distanceFalloff: 0.6, intensity: 2.2 } as const
const BLOOM = { threshold: 0.82, intensity: 0.7, smoothing: 0.2 } as const

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
    <EffectComposer multisampling={quality.multisampling} enableNormalPass={false}>
      <N8AO
        aoRadius={AO.radius}
        distanceFalloff={AO.distanceFalloff}
        intensity={AO.intensity}
        halfRes={quality.multisampling < 8}
      />
      {bloom ? (
        <Bloom
          luminanceThreshold={BLOOM.threshold}
          intensity={BLOOM.intensity}
          luminanceSmoothing={BLOOM.smoothing}
          mipmapBlur
        />
      ) : (
        <></>
      )}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
