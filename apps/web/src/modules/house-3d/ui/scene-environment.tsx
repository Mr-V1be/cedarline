'use client'

import type { Bounds } from '@kedrovnik/house'
import { Environment, Lightformer } from '@react-three/drei'
import { useLayoutEffect, useRef } from 'react'
import type { DirectionalLight } from 'three'

import { SCENE_PALETTE } from './scene-palette'

const SHADOW_MAP = 2048
/** Sun from the front-left and high: facades are lit and shadows fall where the camera sees them. */
const SUN_DIRECTION = [-0.55, 1.7, 0.95] as const

function Sun({ extent }: { readonly extent: number }) {
  const lightRef = useRef<DirectionalLight>(null)
  const reach = extent * 1.6
  useLayoutEffect(() => {
    const current = lightRef.current
    if (current === null) return
    const camera = current.shadow.camera
    camera.left = -reach
    camera.right = reach
    camera.top = reach
    camera.bottom = -reach
    camera.near = 0.5
    camera.far = extent * 6
    camera.updateProjectionMatrix()
    current.shadow.needsUpdate = true
  }, [extent, reach])
  return (
    <directionalLight
      ref={lightRef}
      castShadow
      color={SCENE_PALETTE.sunLight}
      intensity={3.2}
      position={[
        SUN_DIRECTION[0] * extent * 2,
        SUN_DIRECTION[1] * extent * 2,
        SUN_DIRECTION[2] * extent * 2,
      ]}
      shadow-mapSize={[SHADOW_MAP, SHADOW_MAP]}
      shadow-bias={-0.0003}
      shadow-normalBias={0.025}
      shadow-radius={4}
    />
  )
}

/**
 * Daylight without external assets: a sun for shadows, sky and ground fill, and an
 * environment built from light panels for reflections in glass and metal.
 */
export function SceneEnvironment({ bounds }: { readonly bounds: Bounds }) {
  const extent = Math.max(bounds.max[0] - bounds.min[0], bounds.max[2] - bounds.min[2])
  return (
    <>
      <hemisphereLight args={[SCENE_PALETTE.skyLight, SCENE_PALETTE.groundLight, 1.4]} />
      <Sun extent={extent} />
      <Environment resolution={128} frames={1} environmentIntensity={0.9}>
        <Lightformer form="rect" intensity={2.4} position={[0, 8, 12]} scale={[24, 8, 1]} />
        <Lightformer
          form="rect"
          intensity={1.4}
          position={[-14, 5, 2]}
          rotation-y={Math.PI / 2}
          scale={[20, 6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1}
          position={[14, 4, -6]}
          rotation-y={-Math.PI / 2}
          scale={[20, 5, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.6}
          position={[0, 16, 0]}
          rotation-x={Math.PI / 2}
          scale={[30, 30, 1]}
        />
      </Environment>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[extent * 4, 64]} />
        <shadowMaterial color={SCENE_PALETTE.shadow} opacity={0.2} />
      </mesh>
    </>
  )
}
