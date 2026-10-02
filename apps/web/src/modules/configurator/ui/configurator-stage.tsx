'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useState, useSyncExternalStore, type RefObject } from 'react'

import type { HouseViewerInput } from '@/modules/catalog/application/project-overview'
import type { ImageAsset } from '@/modules/catalog/domain/project'
import type { CameraPreset } from '@/modules/house-3d/domain/camera-presets'
import type { SceneCapture } from '@/modules/house-3d/domain/capture'
import { detectQuality } from '@/modules/house-3d/scene/quality'
import { useWebglSupport } from '@/modules/house-3d/ui/webgl-support'

import styles from './configurator-stage.module.css'

const HouseCanvas = dynamic(() => import('@/modules/house-3d/ui/house-canvas'), { ssr: false })

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(REDUCED_MOTION_QUERY)
      media.addEventListener('change', onChange)
      return () => {
        media.removeEventListener('change', onChange)
      }
    },
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  )
}

interface ConfiguratorStageProps {
  readonly input: HouseViewerInput
  readonly camera: CameraPreset
  readonly poster: ImageAsset | null
  readonly label: string
  readonly loadingLabel: string
  readonly captureRef?: RefObject<SceneCapture | null>
}

/**
 * The live house of the configurator. It rebuilds on every choice and flies the camera to
 * what the current step is about; the project's render stands in until the scene is ready
 * or when the browser cannot draw 3D. Nothing is drawn over the picture but a progress line.
 */
export function ConfiguratorStage({
  input,
  camera,
  poster,
  label,
  loadingLabel,
  captureRef,
}: ConfiguratorStageProps) {
  const supported = useWebglSupport()
  const reducedMotion = useReducedMotion()
  const [ready, setReady] = useState(false)

  return (
    <div className={styles.stage} aria-busy={supported && !ready}>
      {poster === null ? null : (
        <Image
          className={`${styles.poster} ${ready ? styles.hidden : ''}`}
          src={poster.url}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 65vw, 100vw"
        />
      )}
      {supported ? (
        <div className={`${styles.canvas} ${ready ? styles.shown : ''}`}>
          <HouseCanvas
            input={input}
            preset={camera}
            scene="day"
            quality={detectQuality()}
            label={label}
            interactive
            animate={!reducedMotion}
            onReady={() => {
              setReady(true)
            }}
            {...(captureRef === undefined ? {} : { captureRef })}
          />
        </div>
      ) : null}
      {supported && !ready ? (
        <div className={styles.progress} role="progressbar" aria-label={loadingLabel} />
      ) : null}
    </div>
  )
}
