'use client'

import { houseModel, measureHouse, type HouseModel as HouseMesh } from '@kedrovnik/house'
import { useEffect, useMemo } from 'react'
import { BufferAttribute, BufferGeometry } from 'three'

import type { HouseViewerInput } from '@/modules/catalog/application/project-overview'

import { SHADOW_CASTERS, createMaterials } from './materials'

/** Builds the mesh from the same domain model that measures and prices the house. */
export function useHouseMesh(input: HouseViewerInput): HouseMesh {
  return useMemo(() => houseModel(measureHouse(input)), [input])
}

export function HouseModel({
  mesh,
  input,
}: {
  readonly mesh: HouseMesh
  readonly input: HouseViewerInput
}) {
  const materials = useMemo(
    () =>
      createMaterials({
        finish: input.options.facadeFinish,
        facadeColor: input.options.facadeColor,
      }),
    [input.options.facadeFinish, input.options.facadeColor],
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
