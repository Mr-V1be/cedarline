'use client'

import dynamic from 'next/dynamic'

import type { HouseViewerInput } from '@/modules/catalog/application/project-overview'

import type { CameraPreset } from '../domain/camera-presets'
import { RENDER_READY_ATTRIBUTE } from '../domain/render'
import styles from './render-still.module.css'

const HouseCanvas = dynamic(() => import('./house-canvas'), { ssr: false })

export function RenderStill({
  input,
  preset,
  label,
}: {
  readonly input: HouseViewerInput
  readonly preset: CameraPreset
  readonly label: string
}) {
  return (
    <div className={styles.frame}>
      <HouseCanvas
        input={input}
        preset={preset}
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
