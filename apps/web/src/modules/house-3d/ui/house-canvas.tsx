'use client'

import { PerformanceMonitor } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { ACESFilmicToneMapping, NoToneMapping, PCFShadowMap } from 'three'

import type { HouseViewerInput } from '@/modules/catalog/application/project-overview'

import type { CameraPreset } from '../domain/camera-presets'
import { HouseScene } from '../scene/house-scene'
import type { ScenePresetKey } from '../scene/presets'
import { QUALITY_TIERS, type QualityKey } from '../scene/quality'

/** Vertical field of view: long-lens architectural perspective with little distortion. */
const FIELD_OF_VIEW = 28

export interface HouseCanvasProps {
  readonly input: HouseViewerInput
  readonly preset: CameraPreset
  readonly scene: ScenePresetKey
  readonly quality: QualityKey
  readonly label: string
  /** Orbit controls and camera flights; off for still renders. */
  readonly interactive: boolean
  readonly animate: boolean
  /** Keeps the drawing buffer so the frame can be captured as an image. */
  readonly capture?: boolean
  readonly onReady?: () => void
}

export default function HouseCanvas({
  input,
  preset,
  scene,
  quality: initialQuality,
  label,
  interactive,
  animate,
  capture = false,
  onReady,
}: HouseCanvasProps) {
  const [qualityKey, setQualityKey] = useState<QualityKey>(initialQuality)
  const quality = QUALITY_TIERS[qualityKey]
  const readyRef = useRef(onReady)
  useEffect(() => {
    readyRef.current = onReady
  }, [onReady])
  const composed = quality.ambientOcclusion

  return (
    <Canvas
      shadows={{ type: PCFShadowMap }}
      frameloop="demand"
      dpr={quality.dpr as number | [number, number]}
      camera={{ fov: FIELD_OF_VIEW, near: 0.1, far: 1200 }}
      gl={{
        antialias: !composed,
        alpha: false,
        preserveDrawingBuffer: capture,
        toneMapping: composed ? NoToneMapping : ACESFilmicToneMapping,
      }}
      role="img"
      aria-label={label}
    >
      {qualityKey === 'still' ? null : (
        <PerformanceMonitor
          onDecline={() => {
            setQualityKey('low')
          }}
        />
      )}
      <HouseScene
        input={input}
        presetKey={scene}
        quality={quality}
        cameraPreset={preset}
        interactive={interactive}
        animate={animate}
        onReady={() => readyRef.current?.()}
      />
    </Canvas>
  )
}
