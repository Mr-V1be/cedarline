import generated from './assets/generated.json'
import manifest from './assets/manifest.json'
import type { SkyKey } from './presets'

export type MaterialKey = keyof typeof manifest.materials
export const MATERIAL_KEYS = Object.keys(manifest.materials) as MaterialKey[]
export type TreeKey = keyof typeof manifest.trees
export const TREE_KEYS = Object.keys(manifest.trees) as TreeKey[]

/**
 * Texture resolutions built by the asset pipeline. Stills (catalog renders) get the sharpest
 * tree atlases and the high material textures; phones get half of everything.
 */
export type TextureTier = 'still' | 'high' | 'low'

const materialTier = (tier: TextureTier): Exclude<TextureTier, 'still'> =>
  tier === 'still' ? 'high' : tier

const ROOT = '/scene'

/** Basis Universal transcoder served by the site (copied from three.js by the asset build). */
export const BASIS_TRANSCODER_PATH = `${ROOT}/basis/`

export const skyHdrUrl = (key: SkyKey) => `${ROOT}/hdri/${key}.hdr`
export const skyImageUrl = (key: SkyKey) => `${ROOT}/sky/${key}.webp`

export interface TextureSetUrls {
  readonly color: string
  readonly normal: string
  readonly arm: string
}

export const textureUrls = (key: MaterialKey, tier: TextureTier): TextureSetUrls => {
  const folder = `${ROOT}/textures/${key}/${materialTier(tier)}`
  return {
    color: `${folder}/color.ktx2`,
    normal: `${folder}/normal.ktx2`,
    arm: `${folder}/arm.ktx2`,
  }
}

/** Real-world size of one texture tile, metres: UVs are metres, so this sets the repeat. */
export const tileSize = (key: MaterialKey): number => manifest.materials[key].tile

export const treeUrls = (key: TreeKey, tier: TextureTier) => ({
  albedo: `${ROOT}/trees/${key}/${tier}/albedo.ktx2`,
  normal: `${ROOT}/trees/${key}/${tier}/normal.ktx2`,
})

/** Impostor atlases hold a grid × grid set of views over the upper hemisphere. */
export const IMPOSTOR_GRID = manifest.impostor.grid

export interface TreeDimensions {
  /** Height of the baked tree, metres. */
  readonly height: number
  /** Half-size of the square each view was rendered into, metres. */
  readonly radius: number
  /** Height of that square's centre above the ground, metres. */
  readonly centreY: number
}

export const treeDimensions = (key: TreeKey): TreeDimensions => generated.trees[key]
