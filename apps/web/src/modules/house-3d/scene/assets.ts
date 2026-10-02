import manifest from './assets/manifest.json'
import type { SkyKey } from './presets'

export type MaterialKey = keyof typeof manifest.materials
export const MATERIAL_KEYS = Object.keys(manifest.materials) as MaterialKey[]

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

export const textureUrls = (key: MaterialKey): TextureSetUrls => ({
  color: `${ROOT}/textures/${key}/color.ktx2`,
  normal: `${ROOT}/textures/${key}/normal.ktx2`,
  arm: `${ROOT}/textures/${key}/arm.ktx2`,
})

/** Real-world size of one texture tile, metres: UVs are metres, so this sets the repeat. */
export const tileSize = (key: MaterialKey): number => manifest.materials[key].tile
