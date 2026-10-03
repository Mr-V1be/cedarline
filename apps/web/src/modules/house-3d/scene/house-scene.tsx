'use client'

import { ContactShadows } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Suspense, useLayoutEffect, useRef, type RefObject } from 'react'

import type { HouseViewerInput } from '@/modules/catalog/application/project-overview'

import type { CameraPreset } from '../domain/camera-presets'
import type { SceneCapture } from '../domain/capture'
import { CameraRig } from '../ui/camera-rig'
import { SceneCaptureBridge } from '../ui/scene-capture'
import { useHouseModel } from '../ui/use-house-model'
import { SceneEffects } from './effects'
import { SceneEnvironment } from './environment'
import { Forest } from './site/forest'
import { HouseMesh } from './house-mesh'
import { SCENE_PRESETS, type ScenePresetKey } from './presets'
import type { QualityTier } from './quality'
import { Site } from './site/site'
import { useSceneTextures } from './use-scene-textures'

/** Frames rendered after everything has loaded before the scene counts as ready. */
const READY_AFTER_FRAMES = 4
const CONTACT_SHADOW = { opacity: 0.55, blur: 2.4, far: 2.2, resolution: 512 } as const

function ReadySignal({ onReady }: { readonly onReady: () => void }) {
  const framesRef = useRef(0)
  const doneRef = useRef(false)
  useFrame(({ invalidate }) => {
    if (doneRef.current) return
    framesRef.current += 1
    if (framesRef.current >= READY_AFTER_FRAMES) {
      doneRef.current = true
      onReady()
    } else {
      invalidate()
    }
  })
  return null
}

/**
 * Renderer settings of the preset. The clear alpha is zero even though the canvas is opaque:
 * contact shadows render into a texture with the renderer's clear colour, and an opaque clear
 * would shade their whole plane.
 */
function RendererSettings({ exposure }: { readonly exposure: number }) {
  const get = useThree((state) => state.get)
  useLayoutEffect(() => {
    const { gl, invalidate } = get()
    gl.toneMappingExposure = exposure
    gl.setClearAlpha(0)
    invalidate()
  }, [get, exposure])
  return null
}

function Dressing({
  input,
  presetKey,
  quality,
}: {
  readonly input: HouseViewerInput
  readonly presetKey: ScenePresetKey
  readonly quality: QualityTier
}) {
  const mesh = useHouseModel(input)
  const textures = useSceneTextures(quality.textures)
  const preset = SCENE_PRESETS[presetKey]
  return (
    <>
      <SceneEnvironment
        preset={preset}
        bounds={mesh.bounds}
        approach={mesh.approach}
        shadowMapSize={quality.shadowMapSize}
      />
      <HouseMesh mesh={mesh} input={input} textures={textures.materials} preset={preset} />
      <Site
        bounds={mesh.bounds}
        approach={mesh.approach}
        site={mesh.site}
        textures={textures.materials}
      />
      <Forest
        bounds={mesh.bounds}
        count={quality.trees}
        castShadow={quality.treeShadows}
        textures={textures.trees}
      />
      {quality.ambientOcclusion ? null : (
        <ContactShadows
          position={[0, 0.02, 0]}
          scale={
            Math.max(
              mesh.bounds.max[0] - mesh.bounds.min[0],
              mesh.bounds.max[2] - mesh.bounds.min[2],
            ) * 1.6
          }
          opacity={CONTACT_SHADOW.opacity}
          blur={CONTACT_SHADOW.blur}
          far={CONTACT_SHADOW.far}
          resolution={CONTACT_SHADOW.resolution}
        />
      )}
    </>
  )
}

export interface HouseSceneProps {
  readonly input: HouseViewerInput
  readonly presetKey: ScenePresetKey
  readonly quality: QualityTier
  readonly cameraPreset: CameraPreset
  readonly interactive: boolean
  readonly animate: boolean
  readonly onReady?: () => void
  /** Receives a function that takes a still of the scene (configuration renders). */
  readonly captureRef?: RefObject<SceneCapture | null>
}

/**
 * The one scene of the product: house, plot, forest, sky and light. Catalog renders, the
 * project page and the configurator all draw this, so every image of a house matches.
 */
export function HouseScene({
  input,
  presetKey,
  quality,
  cameraPreset,
  interactive,
  animate,
  onReady,
  captureRef,
}: HouseSceneProps) {
  const mesh = useHouseModel(input)
  const preset = SCENE_PRESETS[presetKey]
  return (
    <>
      <RendererSettings exposure={preset.exposure} />
      <Suspense fallback={null}>
        <Dressing input={input} presetKey={presetKey} quality={quality} />
        {onReady === undefined ? null : <ReadySignal onReady={onReady} />}
      </Suspense>
      <CameraRig
        bounds={mesh.bounds}
        preset={cameraPreset}
        interactive={interactive}
        animate={animate}
      />
      <SceneEffects quality={quality} preset={preset} />
      {captureRef === undefined ? null : (
        <SceneCaptureBridge captureRef={captureRef} bounds={mesh.bounds} />
      )}
    </>
  )
}
