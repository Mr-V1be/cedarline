'use client'

import { useKTX2 } from '@react-three/drei'
import { useMemo } from 'react'
import { RepeatWrapping, type Texture } from 'three'

import {
  BASIS_TRANSCODER_PATH,
  MATERIAL_KEYS,
  textureUrls,
  tileSize,
  type MaterialKey,
} from './assets'

export interface TextureSet {
  readonly color: Texture
  readonly normal: Texture
  /** glTF ARM: occlusion (R), roughness (G), metalness (B). */
  readonly arm: Texture
}

export type SceneTextures = Readonly<Record<MaterialKey, TextureSet>>

const ANISOTROPY = 8
const MAPS = ['color', 'normal', 'arm'] as const

const URLS: Record<string, string> = Object.fromEntries(
  MATERIAL_KEYS.flatMap((key) => {
    const urls = textureUrls(key)
    return MAPS.map((map) => [`${key}.${map}`, urls[map]])
  }),
)

/**
 * Loads every scene texture as GPU-compressed KTX2 (suspends until ready) and sets each to
 * repeat at its real-world size, since all UVs are in metres.
 */
export function useSceneTextures(): SceneTextures {
  const loaded = useKTX2(URLS, BASIS_TRANSCODER_PATH) as Record<string, Texture>
  return useMemo(() => {
    const entries = MATERIAL_KEYS.map((key) => {
      const repeat = 1 / tileSize(key)
      const set = Object.fromEntries(
        MAPS.map((map) => {
          const texture = loaded[`${key}.${map}`]
          if (texture === undefined) throw new Error(`Scene texture ${key}.${map} did not load`)
          texture.wrapS = RepeatWrapping
          texture.wrapT = RepeatWrapping
          texture.repeat.set(repeat, repeat)
          texture.anisotropy = ANISOTROPY
          texture.needsUpdate = true
          return [map, texture]
        }),
      ) as unknown as TextureSet
      return [key, set] as const
    })
    return Object.fromEntries(entries) as SceneTextures
  }, [loaded])
}
