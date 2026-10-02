'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { PCFShadowMap } from 'three'

import type { HouseViewerInput } from '@/modules/catalog/application/project-overview'

import type { CameraPreset } from '../domain/camera-presets'
import { CameraRig } from './camera-rig'
import { HouseModel, useHouseMesh } from './house-model'
import { SceneEnvironment } from './scene-environment'

/** Vertical field of view: long-lens architectural perspective with little distortion. */
const FIELD_OF_VIEW = 28
/** Frames rendered before the scene counts as ready (shadows and environment settle). */
const READY_AFTER_FRAMES = 3

export interface HouseCanvasProps {
  readonly input: HouseViewerInput
  readonly preset: CameraPreset
  readonly label: string
  /** Orbit controls and camera flights; off for still renders. */
  readonly interactive: boolean
  readonly animate: boolean
  /** Keeps the drawing buffer so the frame can be captured as an image. */
  readonly capture?: boolean
  readonly onReady?: () => void
}

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

export default function HouseCanvas({
  input,
  preset,
  label,
  interactive,
  animate,
  capture = false,
  onReady,
}: HouseCanvasProps) {
  const mesh = useHouseMesh(input)
  const readyHandlerRef = useRef(onReady)
  useEffect(() => {
    readyHandlerRef.current = onReady
  }, [onReady])

  return (
    <Canvas
      shadows={{ type: PCFShadowMap }}
      frameloop="demand"
      dpr={capture ? 1 : [1, 2]}
      camera={{ fov: FIELD_OF_VIEW, near: 0.1, far: 500 }}
      gl={{
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: capture,
        toneMappingExposure: 1.15,
      }}
      role="img"
      aria-label={label}
    >
      <SceneEnvironment bounds={mesh.bounds} />
      <HouseModel mesh={mesh} input={input} />
      <CameraRig bounds={mesh.bounds} preset={preset} interactive={interactive} animate={animate} />
      <ReadySignal onReady={() => readyHandlerRef.current?.()} />
    </Canvas>
  )
}
