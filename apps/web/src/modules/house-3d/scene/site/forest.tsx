'use client'

import type { Bounds } from '@cedarline/house'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { type InstancedMesh, Matrix4, PlaneGeometry, Quaternion, Vector3 } from 'three'

import { CAMERA_PRESETS } from '../../domain/camera-presets'
import { IMPOSTOR_GRID, TREE_KEYS, treeDimensions, type TreeKey } from '../assets'
import { createImpostorMaterials } from './impostor-material'
import { seededRandom } from '../random'
import type { ImpostorTextures } from '../use-scene-textures'

/** A clearing around the house, a near belt of trees where no camera looks through, then forest. */
const CLEARING = 2.4
const NEAR_BELT = 3.4
export const FOREST_EDGE = 4.2
const FOREST_DEPTH = 7
/** Grown heights of the trees, metres: the baked models are scaled into this range. */
const HEIGHT = { min: 11, max: 22 } as const
/** Near trees keep this angle away from every camera preset's line of sight. */
const SIGHT_MARGIN = (30 * Math.PI) / 180
const NEAR_SHARE = 0.1
const SEED = 7_301

const CAMERA_AZIMUTHS = Object.values(CAMERA_PRESETS).map(
  ({ azimuth }) => (azimuth * Math.PI) / 180,
)

const angleGap = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))
const clearOfCameras = (azimuth: number) =>
  CAMERA_AZIMUTHS.every((camera) => angleGap(azimuth, camera) > SIGHT_MARGIN)

interface Placement {
  readonly key: TreeKey
  readonly x: number
  readonly z: number
  readonly height: number
  readonly yaw: number
}

/** Deterministic forest: the same plot always grows the same trees. */
function plantForest(extent: number, count: number): readonly Placement[] {
  const random = seededRandom(SEED + count)
  const placements: Placement[] = []
  for (let attempt = 0; placements.length < count && attempt < count * 20; attempt += 1) {
    const near = placements.length < count * NEAR_SHARE
    const azimuth = random() * Math.PI * 2
    if (near && !clearOfCameras(azimuth)) continue
    const [from, to] = near ? [CLEARING, NEAR_BELT] : [FOREST_EDGE, FOREST_DEPTH]
    const distance = extent * (from + (to - from) * Math.sqrt(random()))
    const key = TREE_KEYS[Math.floor(random() * TREE_KEYS.length)] ?? 'firA'
    placements.push({
      key,
      x: Math.sin(azimuth) * distance,
      z: Math.cos(azimuth) * distance,
      height: HEIGHT.min + (HEIGHT.max - HEIGHT.min) * random() ** 0.8,
      yaw: random() * Math.PI * 2,
    })
  }
  return placements
}

function TreeKind({
  kind,
  placements,
  textures,
  castShadow,
}: {
  readonly kind: TreeKey
  readonly placements: readonly Placement[]
  readonly textures: ImpostorTextures
  readonly castShadow: boolean
}) {
  const meshRef = useRef<InstancedMesh>(null)
  const dimensions = treeDimensions(kind)
  const quad = useMemo(() => new PlaneGeometry(1, 1), [])
  const materials = useMemo(
    () =>
      createImpostorMaterials({
        albedo: textures.albedo,
        normal: textures.normal,
        grid: IMPOSTOR_GRID,
        dimensions,
      }),
    [dimensions, textures],
  )

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (mesh === null) return
    const matrix = new Matrix4()
    const rotation = new Quaternion()
    const up = new Vector3(0, 1, 0)
    placements.forEach((tree, index) => {
      rotation.setFromAxisAngle(up, tree.yaw)
      const scale = tree.height / dimensions.height
      matrix.compose(new Vector3(tree.x, 0, tree.z), rotation, new Vector3(scale, scale, scale))
      mesh.setMatrixAt(index, matrix)
    })
    mesh.count = placements.length
    mesh.instanceMatrix.needsUpdate = true
  }, [dimensions.height, placements])

  return (
    <instancedMesh
      ref={meshRef}
      args={[quad, materials.surface, placements.length]}
      customDepthMaterial={materials.depth}
      castShadow={castShadow}
      frustumCulled={false}
    />
  )
}

interface ForestProps {
  readonly bounds: Bounds
  readonly count: number
  readonly castShadow: boolean
  readonly textures: Readonly<Record<TreeKey, ImpostorTextures>>
}

/**
 * The forest around the plot: impostors of photoscanned firs and pines, one instanced quad per
 * tree and one draw call per kind (two with shadows).
 */
export function Forest({ bounds, count, castShadow, textures }: ForestProps) {
  const extent = Math.max(bounds.max[0] - bounds.min[0], bounds.max[2] - bounds.min[2])
  const placements = useMemo(() => plantForest(extent, count), [count, extent])
  return (
    <group>
      {TREE_KEYS.map((kind) => (
        <TreeKind
          key={kind}
          kind={kind}
          placements={placements.filter((tree) => tree.key === kind)}
          textures={textures[kind]}
          castShadow={castShadow}
        />
      ))}
    </group>
  )
}
