'use client'

import type { Approach, Bounds } from '@kedrovnik/house'
import { Environment, useTexture } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import {
  Color,
  EquirectangularReflectionMapping,
  SRGBColorSpace,
  type DirectionalLight,
} from 'three'

import { skyHdrUrl, skyImageUrl } from './assets'
import { skyLighting, type ScenePreset } from './presets'

const HAZE_WHITE = new Color('#ffffff')
const NORMAL_BIAS_TEXELS = 1.5
/** The porch lamp hangs above the door side of the path, metres. */
const PORCH = { height: 2.5, setBack: 1.6, distance: 9 } as const

function Sun({
  extent,
  direction,
  preset,
  shadowMapSize,
}: {
  extent: number
  direction: readonly [number, number, number]
  preset: ScenePreset
  shadowMapSize: number
}) {
  const lightRef = useRef<DirectionalLight>(null)
  const reach = extent * 1.7
  useLayoutEffect(() => {
    const light = lightRef.current
    if (light === null) return
    const camera = light.shadow.camera
    camera.left = -reach
    camera.right = reach
    camera.top = reach
    camera.bottom = -reach
    camera.near = 0.5
    camera.far = extent * 8
    camera.updateProjectionMatrix()
    light.shadow.needsUpdate = true
  }, [extent, reach])
  const distance = extent * 3
  return (
    <directionalLight
      ref={lightRef}
      castShadow
      color={preset.sun.color}
      intensity={preset.sun.intensity}
      position={[
        direction[0] * distance,
        Math.max(direction[1], 0.12) * distance,
        direction[2] * distance,
      ]}
      shadow-mapSize={[shadowMapSize, shadowMapSize]}
      shadow-bias={-0.0002}
      // Offset by about a texel and a half of the shadow map: smaller maps (phones) cover the
      // same area with coarser texels and would otherwise shade the ground with acne.
      shadow-normalBias={Math.max(0.03, ((2 * reach) / shadowMapSize) * NORMAL_BIAS_TEXELS)}
      shadow-radius={5}
    />
  )
}

function SkyBackground({ preset, rotation }: { preset: ScenePreset; rotation: number }) {
  const get = useThree((state) => state.get)
  const texture = useTexture(skyImageUrl(preset.sky), (loaded) => {
    loaded.mapping = EquirectangularReflectionMapping
    loaded.colorSpace = SRGBColorSpace
  })
  useLayoutEffect(() => {
    get().scene.backgroundRotation.set(0, rotation, 0)
  }, [get, rotation])
  return <primitive attach="background" object={texture} />
}

interface SceneEnvironmentProps {
  readonly preset: ScenePreset
  readonly bounds: Bounds
  readonly approach: Approach | null
  readonly shadowMapSize: number
}

/**
 * Sky and light: an HDRI lights the scene and an image of the same sky fills the background,
 * both turned so the sun stands front-left. A matching directional light throws the shadows,
 * and fog in the horizon colour gives distant trees atmospheric perspective.
 */
export function SceneEnvironment({
  preset,
  bounds,
  approach,
  shadowMapSize,
}: SceneEnvironmentProps) {
  const extent = Math.max(bounds.max[0] - bounds.min[0], bounds.max[2] - bounds.min[2])
  const lighting = skyLighting(preset.sky)
  const haze = new Color(lighting.horizon).lerp(HAZE_WHITE, preset.haze.tint)

  return (
    <>
      <fog
        attach="fog"
        args={[haze, extent * preset.haze.near, extent * preset.haze.far]}
        key={`${haze.getHexString()}-${extent}-${preset.haze.near}-${preset.haze.far}`}
      />
      <Environment
        files={skyHdrUrl(preset.sky)}
        environmentIntensity={preset.environmentIntensity}
        environmentRotation={[0, lighting.rotation, 0]}
      />
      <SkyBackground preset={preset} rotation={lighting.rotation} />
      <Sun
        extent={extent}
        direction={lighting.sunDirection}
        preset={preset}
        shadowMapSize={shadowMapSize}
      />
      {preset.porchLight === null || approach === null ? null : (
        <pointLight
          color={preset.porchLight.color}
          intensity={preset.porchLight.intensity}
          distance={PORCH.distance}
          decay={2}
          position={[
            approach.start[0] - approach.direction[0] * PORCH.setBack,
            PORCH.height,
            approach.start[2] - approach.direction[2] * PORCH.setBack,
          ]}
        />
      )}
    </>
  )
}
