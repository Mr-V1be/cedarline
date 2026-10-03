'use client'

import type { Approach, Bounds, SiteAnchors } from '@kedrovnik/house'
import { useEffect, useMemo } from 'react'
import { MeshStandardMaterial } from 'three'

import { tileSize } from '../assets'
import { FOREST_EDGE } from './forest'
import { createGroundMaterial } from './ground-material'
import { GROUND_TINTS, SCENE_PALETTE } from '../palette'
import { blindAreaGeometry, metricBox, metricPlane } from './site-geometry'
import type { SceneTextures } from '../use-scene-textures'

/** Plot dressing, metres. */
const GROUND_SCALE = 9
/** Blind area: 0.8 m of paving around the walls, standing a few centimetres proud of the lawn. */
const BLIND_AREA = { width: 0.8, height: 0.035 } as const
const PATH = { length: 3.2, lift: 0.012 } as const
/** Both sides of the path, as offsets from its axis. */
const EDGE_SIDES = [
  { key: 'left', sign: -1 },
  { key: 'right', sign: 1 },
] as const

/** Steel edging that holds the gravel of the path. */
const EDGING = { width: 0.04, height: 0.03 } as const
/** The lawn frays into forest floor over this band, as a share of the forest edge distance. */
const FOREST_BLEND = [0.78, 1.02] as const

interface SiteProps {
  readonly bounds: Bounds
  readonly approach: Approach | null
  readonly site: SiteAnchors
  readonly textures: SceneTextures['materials']
}

function pbr(set: SceneTextures['materials'][keyof SceneTextures['materials']], color: string) {
  return new MeshStandardMaterial({
    color,
    map: set.color,
    normalMap: set.normal,
    roughnessMap: set.arm,
    aoMap: set.arm,
  })
}

export function Site({ bounds, approach, site, textures }: SiteProps) {
  const extent = Math.max(bounds.max[0] - bounds.min[0], bounds.max[2] - bounds.min[2])
  const ground = useMemo(
    () => metricPlane(extent * GROUND_SCALE * 2, extent * GROUND_SCALE * 2, 1),
    [extent],
  )
  const groundMaterial = useMemo(
    () =>
      createGroundMaterial({
        lawn: textures.grass,
        forestFloor: textures.forestFloor,
        lawnTint: GROUND_TINTS.grass,
        forestTint: GROUND_TINTS.forestFloor,
        forestRepeat: 1 / tileSize('forestFloor'),
        forestEdge: [
          extent * FOREST_EDGE * FOREST_BLEND[0],
          extent * FOREST_EDGE * FOREST_BLEND[1],
        ],
      }),
    [extent, textures.forestFloor, textures.grass],
  )
  const blindArea = useMemo(
    () => blindAreaGeometry(site, BLIND_AREA.width, BLIND_AREA.height),
    [site],
  )
  const pathLength = extent * PATH.length
  const path = useMemo(() => {
    if (approach === null) return null
    const half = approach.width / 2
    return {
      gravel: metricPlane(approach.width, pathLength),
      edging: EDGE_SIDES.map(({ key, sign }) => ({
        key,
        geometry: metricBox(
          {
            min: [sign * half - EDGING.width / 2, -pathLength / 2],
            max: [sign * half + EDGING.width / 2, pathLength / 2],
          },
          -EDGING.height,
          EDGING.height,
        ),
      })),
    }
  }, [approach, pathLength])
  const materials = useMemo(
    () => ({
      blindArea: pbr(textures.blindArea, GROUND_TINTS.blindArea),
      gravel: pbr(textures.gravel, GROUND_TINTS.gravel),
      edging: new MeshStandardMaterial({
        color: SCENE_PALETTE.edging,
        roughness: 0.55,
        metalness: 0.4,
      }),
    }),
    [textures.blindArea, textures.gravel],
  )
  useEffect(
    () => () => {
      for (const material of [groundMaterial, ...Object.values(materials)]) material.dispose()
    },
    [groundMaterial, materials],
  )
  useEffect(
    () => () => {
      const geometries = [
        ground,
        blindArea,
        path?.gravel,
        ...(path?.edging ?? []).map((edge) => edge.geometry),
      ]
      for (const geometry of geometries) geometry?.dispose()
    },
    [ground, blindArea, path],
  )

  return (
    <group>
      <mesh geometry={ground} material={groundMaterial} receiveShadow />
      {blindArea === null ? null : (
        <mesh geometry={blindArea} material={materials.blindArea} receiveShadow />
      )}
      {approach === null || path === null ? null : (
        <group
          position={[
            approach.start[0] + (approach.direction[0] * pathLength) / 2,
            PATH.lift,
            approach.start[2] + (approach.direction[2] * pathLength) / 2,
          ]}
          rotation-y={Math.atan2(approach.direction[0], approach.direction[2])}
        >
          <mesh geometry={path.gravel} material={materials.gravel} receiveShadow />
          {path.edging.map((edging) => (
            <mesh
              key={edging.key}
              geometry={edging.geometry}
              material={materials.edging}
              castShadow
              receiveShadow
            />
          ))}
        </group>
      )}
    </group>
  )
}
