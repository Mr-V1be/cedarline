'use client'

import { CubeIcon } from '@phosphor-icons/react/ssr'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

import type { HouseViewerInput } from '@/modules/catalog/application/project-overview'
import type { ImageAsset } from '@/modules/catalog/domain/project'
import { Button } from '@/ui/components/button/button'
import { SegmentedControl } from '@/ui/components/segmented/segmented-control'

import { VIEWER_PRESETS, type ViewerPreset } from '../domain/camera-presets'
import styles from './house-stage.module.css'

const HouseCanvas = dynamic(() => import('./house-canvas'), { ssr: false })

/** Large screens with a mouse load the 3D scene on their own; others on request. */
const AUTOLOAD_QUERY = '(min-width: 1024px) and (pointer: fine)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => {
        media.removeEventListener('change', onChange)
      }
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

const webglAvailable = () => {
  try {
    return document.createElement('canvas').getContext('webgl2') !== null
  } catch {
    return false
  }
}

export interface HouseStageLabels {
  readonly model: string
  readonly open: string
  readonly views: string
  readonly unsupported: string
  readonly presets: Record<ViewerPreset, string>
}

interface HouseStageProps {
  readonly input: HouseViewerInput
  readonly poster: ImageAsset | null
  readonly labels: HouseStageLabels
  /** The page's largest image: load the poster eagerly. */
  readonly priority?: boolean
  readonly sizes: string
}

/**
 * A render of the house that turns into the live 3D model. The poster is shown at once; the
 * scene loads when the stage is visible and the browser is idle, or when asked to.
 */
export function HouseStage({ input, poster, labels, priority = false, sizes }: HouseStageProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const autoload = useMediaQuery(AUTOLOAD_QUERY) || poster === null
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY)
  const [requested, setRequested] = useState(false)
  const [visible, setVisible] = useState(false)
  const [ready, setReady] = useState(false)
  const [preset, setPreset] = useState<ViewerPreset>('corner')
  const supported = useSyncExternalStore(
    () => () => undefined,
    webglAvailable,
    () => true,
  )

  useEffect(() => {
    const element = stageRef.current
    if (element === null) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting === true) {
        setVisible(true)
        observer.disconnect()
      }
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [])

  const [idle, setIdle] = useState(false)
  useEffect(() => {
    if (!visible) return
    const handle = window.requestIdleCallback(
      () => {
        setIdle(true)
      },
      { timeout: 2500 },
    )
    return () => {
      window.cancelIdleCallback(handle)
    }
  }, [visible])

  const active = supported && (requested || (autoload && idle))

  return (
    <div className={styles.stage}>
      <div ref={stageRef} className={styles.viewport}>
        {poster === null ? null : (
          <Image
            className={`${styles.poster} ${ready ? styles.hidden : ''}`}
            src={poster.url}
            alt={poster.alt}
            fill
            sizes={sizes}
            priority={priority}
          />
        )}
        {active ? (
          <div className={`${styles.canvas} ${ready ? styles.shown : ''}`}>
            <HouseCanvas
              input={input}
              preset={preset}
              label={labels.model}
              interactive
              animate={!reducedMotion}
              onReady={() => {
                setReady(true)
              }}
            />
          </div>
        ) : null}
      </div>
      <div className={styles.controls}>
        {!supported ? <p className={styles.note}>{labels.unsupported}</p> : null}
        {supported && !active ? (
          <Button
            variant="secondary"
            icon={CubeIcon}
            onClick={() => {
              setRequested(true)
            }}
          >
            {labels.open}
          </Button>
        ) : null}
        {active ? (
          <SegmentedControl
            legend={labels.views}
            name="camera-preset"
            value={preset}
            options={VIEWER_PRESETS.map((key) => ({ value: key, label: labels.presets[key] }))}
            onChange={setPreset}
          />
        ) : null}
      </div>
    </div>
  )
}
