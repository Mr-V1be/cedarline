'use client'

import type { Approach, Bounds } from '@kedrovnik/house'
import { useMemo } from 'react'
import { BufferAttribute, Float32BufferAttribute, PlaneGeometry, type BufferGeometry } from 'three'

import { GROUND_TINTS } from './palette'
import { valueNoise } from './random'
import type { SceneTextures } from './use-scene-textures'

/** Plot dressing, metres: the house stands on gravel, a paved path leads to its entrance. */
const GROUND = { scale: 9, segments: 120, noiseScale: 0.045 } as const
const GRAVEL_MARGIN = 0.7
const PATH_LENGTH = 3.2
const LIFT = { gravel: 0.006, path: 0.012 } as const

/** Horizontal plane with UVs in metres, so tiled textures keep their real size. */
function metricPlane(width: number, depth: number, segments = 1): BufferGeometry {
  const plane = new PlaneGeometry(width, depth, segments, segments).rotateX(-Math.PI / 2)
  const positions = plane.getAttribute('position')
  const uvs = new Float32Array(positions.count * 2)
  for (let index = 0; index < positions.count; index += 1) {
    uvs[index * 2] = positions.getX(index)
    uvs[index * 2 + 1] = -positions.getZ(index)
  }
  plane.setAttribute('uv', new BufferAttribute(uvs, 2))
  return plane
}

/** Large-scale brightness and dryness variation, so the lawn does not tile visibly. */
function groundGeometry(radius: number): BufferGeometry {
  const plane = metricPlane(radius * 2, radius * 2, GROUND.segments)
  const positions = plane.getAttribute('position')
  const colors = new Float32Array(positions.count * 3)
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index) * GROUND.noiseScale
    const z = positions.getZ(index) * GROUND.noiseScale
    const shade = 0.7 + valueNoise(x, z) * 0.42
    const dry = valueNoise(x * 2.3 + 17, z * 2.3 - 9) * 0.2
    colors.set([shade + dry, shade + dry * 0.8, shade - dry * 0.6], index * 3)
  }
  plane.setAttribute('color', new Float32BufferAttribute(colors, 3))
  return plane
}

interface SiteProps {
  readonly bounds: Bounds
  readonly approach: Approach | null
  readonly textures: SceneTextures
}

export function Site({ bounds, approach, textures }: SiteProps) {
  const extent = Math.max(bounds.max[0] - bounds.min[0], bounds.max[2] - bounds.min[2])
  const ground = useMemo(() => groundGeometry(extent * GROUND.scale), [extent])
  const gravel = useMemo(
    () =>
      metricPlane(
        bounds.max[0] - bounds.min[0] + 2 * GRAVEL_MARGIN,
        bounds.max[2] - bounds.min[2] + 2 * GRAVEL_MARGIN,
      ),
    [bounds],
  )
  const pathLength = extent * PATH_LENGTH
  const path = useMemo(
    () => (approach === null ? null : metricPlane(approach.width, pathLength)),
    [approach, pathLength],
  )
  const centre: [number, number, number] = [
    (bounds.min[0] + bounds.max[0]) / 2,
    LIFT.gravel,
    (bounds.min[2] + bounds.max[2]) / 2,
  ]

  return (
    <group>
      <mesh geometry={ground} receiveShadow>
        <meshStandardMaterial
          vertexColors
          color={GROUND_TINTS.grass}
          map={textures.grass.color}
          normalMap={textures.grass.normal}
          roughnessMap={textures.grass.arm}
          aoMap={textures.grass.arm}
        />
      </mesh>
      <mesh geometry={gravel} position={centre} receiveShadow>
        <meshStandardMaterial
          color={GROUND_TINTS.gravel}
          map={textures.gravel.color}
          normalMap={textures.gravel.normal}
          roughnessMap={textures.gravel.arm}
          aoMap={textures.gravel.arm}
        />
      </mesh>
      {approach === null || path === null ? null : (
        <mesh
          geometry={path}
          position={[
            approach.start[0] + (approach.direction[0] * pathLength) / 2,
            LIFT.path,
            approach.start[2] + (approach.direction[2] * pathLength) / 2,
          ]}
          rotation-y={Math.atan2(approach.direction[0], approach.direction[2])}
          receiveShadow
        >
          <meshStandardMaterial
            color={GROUND_TINTS.paving}
            map={textures.paving.color}
            normalMap={textures.paving.normal}
            roughnessMap={textures.paving.arm}
            aoMap={textures.paving.arm}
          />
        </mesh>
      )}
    </group>
  )
}
