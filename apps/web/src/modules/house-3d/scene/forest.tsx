'use client'

import type { Bounds } from '@kedrovnik/house'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  Color,
  DoubleSide,
  type InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three'

import { CAMERA_PRESETS } from '../domain/camera-presets'
import { createConiferGeometry } from './conifer'
import { seededRandom } from './random'

/** A clearing around the house, a near belt of trees where no camera looks through, then forest. */
const CLEARING = 1.5
const NEAR_BELT = 2.6
const FOREST = { from: 4.2, to: 8 } as const
const HEIGHT = { min: 9, max: 19 } as const
/** Near trees keep this angle away from every camera preset's line of sight. */
const SIGHT_MARGIN = (30 * Math.PI) / 180
const NEAR_SHARE = 0.22
const SEED = 7_301

const CAMERA_AZIMUTHS = Object.values(CAMERA_PRESETS).map(
  ({ azimuth }) => (azimuth * Math.PI) / 180,
)

const angleGap = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))
const clearOfCameras = (azimuth: number) =>
  CAMERA_AZIMUTHS.every((camera) => angleGap(azimuth, camera) > SIGHT_MARGIN)

interface ForestProps {
  readonly bounds: Bounds
  readonly count: number
  readonly castShadow: boolean
}

/** Instanced spruces around the plot: one draw call, deterministic placement. */
export function Forest({ bounds, count, castShadow }: ForestProps) {
  const meshRef = useRef<InstancedMesh>(null)
  const extent = Math.max(bounds.max[0] - bounds.min[0], bounds.max[2] - bounds.min[2])
  const geometry = useMemo(() => createConiferGeometry(SEED), [])
  const material = useMemo(
    () => new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: DoubleSide }),
    [],
  )

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (mesh === null) return
    const random = seededRandom(SEED + count)
    const matrix = new Matrix4()
    const rotation = new Quaternion()
    const tint = new Color()
    let placed = 0
    for (let attempt = 0; placed < count && attempt < count * 20; attempt += 1) {
      const near = placed < count * NEAR_SHARE
      const azimuth = random() * Math.PI * 2
      if (near && !clearOfCameras(azimuth)) continue
      const [from, to] = near ? [CLEARING, NEAR_BELT] : [FOREST.from, FOREST.to]
      const distance = extent * (from + (to - from) * Math.sqrt(random()))
      const height = HEIGHT.min + (HEIGHT.max - HEIGHT.min) * random()
      rotation.setFromAxisAngle(new Vector3(0, 1, 0), random() * Math.PI * 2)
      matrix.compose(
        new Vector3(Math.sin(azimuth) * distance, 0, Math.cos(azimuth) * distance),
        rotation,
        new Vector3(height, height, height),
      )
      mesh.setMatrixAt(placed, matrix)
      mesh.setColorAt(placed, tint.setScalar(0.72 + random() * 0.32))
      placed += 1
    }
    mesh.count = placed
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor !== null) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [count, extent])

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow={castShadow}
      receiveShadow
      frustumCulled={false}
    />
  )
}
