'use client'

import { useKTX2 } from '@react-three/drei'
import { useMemo } from 'react'
import { ClampToEdgeWrapping, RepeatWrapping, type Texture } from 'three'

import {
  BASIS_TRANSCODER_PATH,
  MATERIAL_KEYS,
  TREE_KEYS,
  textureUrls,
  tileSize,
  treeUrls,
  type MaterialKey,
  type TextureTier,
  type TreeKey,
} from './assets'

export interface TextureSet {
  readonly color: Texture
  readonly normal: Texture
  /** glTF ARM: occlusion (R), roughness (G), metalness (B). */
  readonly arm: Texture
}

export interface ImpostorTextures {
  readonly albedo: Texture
  readonly normal: Texture
}

export interface SceneTextures {
  readonly materials: Readonly<Record<MaterialKey, TextureSet>>
  readonly trees: Readonly<Record<TreeKey, ImpostorTextures>>
}

const ANISOTROPY = 8
const MAPS = ['color', 'normal', 'arm'] as const
const TREE_MAPS = ['albedo', 'normal'] as const

function urlsOf(tier: TextureTier): Record<string, string> {
  return Object.fromEntries([
    ...MATERIAL_KEYS.flatMap((key) => {
      const urls = textureUrls(key, tier)
      return MAPS.map((map) => [`material.${key}.${map}`, urls[map]] as const)
    }),
    ...TREE_KEYS.flatMap((key) => {
      const urls = treeUrls(key, tier)
      return TREE_MAPS.map((map) => [`tree.${key}.${map}`, urls[map]] as const)
    }),
  ])
}

function loaded(textures: Record<string, Texture>, name: string): Texture {
  const texture = textures[name]
  if (texture === undefined) throw new Error(`Scene texture ${name} did not load`)
  return texture
}

/**
 * Loads every scene texture of a tier as GPU-compressed KTX2 (suspends until ready). Material
 * textures repeat at their real-world size, since all UVs are in metres; impostor atlases clamp.
 */
export function useSceneTextures(tier: TextureTier): SceneTextures {
  const urls = useMemo(() => urlsOf(tier), [tier])
  const textures = useKTX2(urls, BASIS_TRANSCODER_PATH) as Record<string, Texture>
  return useMemo(() => {
    const materials = Object.fromEntries(
      MATERIAL_KEYS.map((key) => {
        const repeat = 1 / tileSize(key)
        const set = Object.fromEntries(
          MAPS.map((map) => {
            const texture = loaded(textures, `material.${key}.${map}`)
            texture.wrapS = RepeatWrapping
            texture.wrapT = RepeatWrapping
            texture.repeat.set(repeat, repeat)
            texture.anisotropy = ANISOTROPY
            texture.needsUpdate = true
            return [map, texture]
          }),
        ) as unknown as TextureSet
        return [key, set]
      }),
    ) as Record<MaterialKey, TextureSet>
    const trees = Object.fromEntries(
      TREE_KEYS.map((key) => {
        const set = Object.fromEntries(
          TREE_MAPS.map((map) => {
            const texture = loaded(textures, `tree.${key}.${map}`)
            texture.wrapS = ClampToEdgeWrapping
            texture.wrapT = ClampToEdgeWrapping
            texture.needsUpdate = true
            return [map, texture]
          }),
        ) as unknown as ImpostorTextures
        return [key, set]
      }),
    ) as Record<TreeKey, ImpostorTextures>
    return { materials, trees }
  }, [textures])
}
