'use client'

import dynamic from 'next/dynamic'

import type { HouseViewerInput } from '@/modules/catalog/application/project-overview'

import type { CameraPreset } from '../domain/camera-presets'
import { RENDER_READY_ATTRIBUTE } from '../domain/render'
import type { ScenePresetKey } from '../scene/presets'
import styles from './render-still.module.css'

const HouseCanvas = dynamic(() => import('./house-canvas'), { ssr: false })

interface RenderStillProps {
  readonly input: HouseViewerInput
  readonly preset: CameraPreset
  readonly scene: ScenePresetKey
  readonly label: string
}

/** Full-window still of the scene at the highest quality, flagged when ready for capture. */
export function RenderStill({ input, preset, scene, label }: RenderStillProps) {
  return (
    <div className={styles.frame}>
      <HouseCanvas
        input={input}
        preset={preset}
        scene={scene}
        quality="still"
        label={label}
        interactive={false}
        animate={false}
        capture
        onReady={() => {
          document.documentElement.setAttribute(RENDER_READY_ATTRIBUTE, 'true')
        }}
      />
    </div>
  )
}
