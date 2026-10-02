'use client'

import type { Bounds } from '@kedrovnik/house'
import { useThree } from '@react-three/fiber'
import { useEffect, type RefObject } from 'react'
import { ACESFilmicToneMapping, type PerspectiveCamera, Vector2 } from 'three'

import type { SceneCapture } from '../domain/capture'
import { fitDistance, frameModel, presetPosition } from './framing'

const JPEG_QUALITY = 0.9

async function toBlob(dataUrl: string): Promise<Blob | null> {
  try {
    return await (await fetch(dataUrl)).blob()
  } catch {
    return null
  }
}

/**
 * Lets the page take a picture of the scene: one synchronous pass renders the preset view at
 * the requested size, reads it out and restores the live view before the browser paints, so
 * the visitor never sees the switch. Screen-space effects are skipped for the still.
 */
export function SceneCaptureBridge({
  captureRef,
  bounds,
}: {
  readonly captureRef: RefObject<SceneCapture | null>
  readonly bounds: Bounds
}) {
  const get = useThree((state) => state.get)

  useEffect(() => {
    captureRef.current = ({ width, height, preset }) => {
      const { gl, scene, camera, invalidate } = get()
      const perspective = camera as PerspectiveCamera
      const previous = {
        size: gl.getSize(new Vector2()),
        pixelRatio: gl.getPixelRatio(),
        toneMapping: gl.toneMapping,
        position: perspective.position.clone(),
        quaternion: perspective.quaternion.clone(),
        aspect: perspective.aspect,
      }
      const framing = frameModel(bounds)
      const distance = fitDistance(bounds, framing, preset, perspective.fov, width / height)

      gl.setPixelRatio(1)
      gl.setSize(width, height, false)
      gl.toneMapping = ACESFilmicToneMapping
      perspective.aspect = width / height
      perspective.position.set(...presetPosition(framing, preset, distance))
      perspective.lookAt(...framing.target)
      perspective.updateProjectionMatrix()
      gl.render(scene, perspective)
      const dataUrl = gl.domElement.toDataURL('image/jpeg', JPEG_QUALITY)

      gl.setPixelRatio(previous.pixelRatio)
      gl.setSize(previous.size.x, previous.size.y, false)
      perspective.position.copy(previous.position)
      perspective.quaternion.copy(previous.quaternion)
      perspective.aspect = previous.aspect
      perspective.updateProjectionMatrix()
      gl.render(scene, perspective)
      gl.toneMapping = previous.toneMapping
      invalidate()
      return toBlob(dataUrl)
    }
    return () => {
      captureRef.current = null
    }
  }, [bounds, captureRef, get])

  return null
}
