'use client'

import type { Bounds } from '@kedrovnik/house'
import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type ComponentRef } from 'react'
import { type PerspectiveCamera, Vector3 } from 'three'

import type { CameraPreset } from '../domain/camera-presets'
import { fitDistance, frameModel, presetPosition } from './framing'

const FLIGHT_SECONDS = 0.9
const MIN_POLAR = 0.12
const MAX_POLAR = Math.PI / 2 - 0.04

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

interface CameraRigProps {
  readonly bounds: Bounds
  readonly preset: CameraPreset
  readonly interactive: boolean
  readonly animate: boolean
}

/** Frames the house for the current preset; with motion allowed, the camera flies between presets. */
export function CameraRig({ bounds, preset, interactive, animate }: CameraRigProps) {
  const { camera, size, invalidate } = useThree()
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null)
  const perspective = camera as PerspectiveCamera
  const aspect = size.width / Math.max(1, size.height)
  const framing = useMemo(() => frameModel(bounds), [bounds])
  const distance = useMemo(
    () => fitDistance(bounds, framing, preset, perspective.fov, aspect),
    [aspect, bounds, framing, perspective.fov, preset],
  )
  const flightRef = useRef<{ from: Vector3; to: Vector3; elapsed: number } | null>(null)
  const placedRef = useRef(false)

  useEffect(() => {
    const to = new Vector3(...presetPosition(framing, preset, distance))
    const target = new Vector3(...framing.target)
    if (!placedRef.current || !animate) {
      camera.position.copy(to)
      camera.lookAt(target)
      placedRef.current = true
      flightRef.current = null
    } else {
      flightRef.current = { from: camera.position.clone(), to, elapsed: 0 }
    }
    controlsRef.current?.target.copy(target)
    controlsRef.current?.update()
    invalidate()
  }, [animate, camera, distance, framing, invalidate, preset])

  useFrame((_, delta) => {
    const current = flightRef.current
    if (current === null) return
    current.elapsed = Math.min(FLIGHT_SECONDS, current.elapsed + delta)
    camera.position.lerpVectors(
      current.from,
      current.to,
      easeInOut(current.elapsed / FLIGHT_SECONDS),
    )
    camera.lookAt(...framing.target)
    controlsRef.current?.update()
    if (current.elapsed >= FLIGHT_SECONDS) flightRef.current = null
    invalidate()
  })

  if (!interactive) return null
  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableDamping={animate}
      minPolarAngle={MIN_POLAR}
      maxPolarAngle={MAX_POLAR}
      minDistance={framing.radius * 1.3}
      maxDistance={distance * 1.8}
      target={[...framing.target]}
      onStart={() => {
        flightRef.current = null
      }}
    />
  )
}
