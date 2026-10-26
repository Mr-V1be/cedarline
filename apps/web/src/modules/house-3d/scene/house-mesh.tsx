'use client'

import type { HouseModel } from '@cedarline/house'
import { useEffect, useMemo } from 'react'
import { BufferAttribute, BufferGeometry } from 'three'

import type { HouseViewerInput } from '@/modules/catalog/application/project-overview'

import { SHADOW_CASTERS, createHouseMaterials } from './house-materials'
import type { ScenePreset } from './presets'
import type { SceneTextures } from './use-scene-textures'

interface HouseMeshProps {
  readonly mesh: HouseModel
  readonly input: HouseViewerInput
  readonly textures: SceneTextures['materials']
  readonly preset: ScenePreset
}

/** The domain mesh as three.js objects: one geometry and one material per slot. */
export function HouseMesh({ mesh, input, textures, preset }: HouseMeshProps) {
  const materials = useMemo(
    () =>
      createHouseMaterials(textures, {
        finish: input.options.facadeFinish,
        facadeColor: input.options.facadeColor,
        glow: preset.windowGlow,
      }),
    [input.options.facadeColor, input.options.facadeFinish, preset.windowGlow, textures],
  )
  const geometries = useMemo(
    () =>
      mesh.parts.map((part) => {
        const geometry = new BufferGeometry()
        geometry.setAttribute('position', new BufferAttribute(part.positions, 3))
        geometry.setAttribute('normal', new BufferAttribute(part.normals, 3))
        geometry.setAttribute('uv', new BufferAttribute(part.uvs, 2))
        geometry.setIndex(new BufferAttribute(part.indices, 1))
        geometry.computeBoundingSphere()
        return { slot: part.slot, geometry }
      }),
    [mesh],
  )

  useEffect(
    () => () => {
      geometries.forEach(({ geometry }) => {
        geometry.dispose()
      })
    },
    [geometries],
  )
  useEffect(
    () => () => {
      Object.values(materials).forEach((material) => {
        material.dispose()
      })
    },
    [materials],
  )

  return (
    <group>
      {geometries.map(({ slot, geometry }) => (
        <mesh
          key={slot}
          geometry={geometry}
          material={materials[slot]}
          castShadow={SHADOW_CASTERS.has(slot)}
          receiveShadow
        />
      ))}
    </group>
  )
}
