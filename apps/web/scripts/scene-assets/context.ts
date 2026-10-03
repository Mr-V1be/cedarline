import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export interface AssetRef {
  readonly source: 'polyhaven' | 'ambientcg'
  readonly id: string
}

type Rgb = readonly [number, number, number]

export interface SkyRef extends AssetRef {
  /**
   * Colour grade of the background image: an exposure multiplier and a vertical tint from the
   * horizon up to the zenith (an evening sky warmed low and deepened high reads as dusk).
   */
  readonly grade?: { readonly exposure: number; readonly horizon: Rgb; readonly zenith: Rgb }
}

export interface MaterialRef extends AssetRef {
  readonly tile: number
  readonly neutral: boolean
  /** Texture edge in pixels for the high tier; the low tier gets half. */
  readonly size: number
}

export interface TreeRef extends AssetRef {
  /** glTF node holding this tree in the source file (Poly Haven ships three per file). */
  readonly node: string
}

export interface Manifest {
  readonly skies: Record<string, SkyRef>
  readonly materials: Record<string, MaterialRef>
  readonly trees: Record<string, TreeRef>
  readonly impostor: { readonly grid: number; readonly cell: number }
}

const web = path.resolve(import.meta.dirname, '../..')
const sceneModule = path.join(web, 'src/modules/house-3d/scene/assets')

export const PATHS = {
  web,
  manifest: path.join(sceneModule, 'manifest.json'),
  generated: path.join(sceneModule, 'generated.json'),
  cache: path.join(web, '.scene-cache'),
  public: path.join(web, 'public/scene'),
} as const

/** Material texture tiers: the high tier at the manifest size, the low tier (phones) at half. */
export const TEXTURE_TIERS = { high: 1, low: 0.5 } as const
/**
 * Impostor atlas tiers relative to the baked atlas: offline stills get the full bake, so trees
 * near the camera stay sharp; live views a half, phones a quarter.
 */
export const TREE_TIERS = { still: 1, high: 0.5, low: 0.25 } as const

export const readManifest = (): Manifest =>
  JSON.parse(readFileSync(PATHS.manifest, 'utf8')) as Manifest

export async function download(url: string, file: string): Promise<string> {
  if (existsSync(file)) return file
  mkdirSync(path.dirname(file), { recursive: true })
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed ${response.status}: ${url}`)
  writeFileSync(file, Buffer.from(await response.arrayBuffer()))
  return file
}

export async function polyhaven(endpoint: string): Promise<unknown> {
  const response = await fetch(`https://api.polyhaven.com/${endpoint}`)
  if (!response.ok) throw new Error(`Poly Haven API ${response.status}: ${endpoint}`)
  return response.json()
}

export async function polyhavenAuthors(id: string): Promise<string[]> {
  const info = (await polyhaven(`info/${id}`)) as { authors: Record<string, string> }
  return Object.keys(info.authors)
}

export function ktx(args: string[]) {
  execFileSync('ktx', ['create', ...args], { stdio: 'inherit' })
}

/** ETC1S (Basis LZ) colour data with mipmaps: small downloads, fine for albedo. */
export const colourKtx = (input: string, output: string, alpha = false) => {
  ktx([
    '--format',
    alpha ? 'R8G8B8A8_SRGB' : 'R8G8B8_SRGB',
    '--assign-tf',
    'srgb',
    '--encode',
    'basis-lz',
    '--clevel',
    '2',
    '--qlevel',
    '200',
    '--generate-mipmap',
    input,
    output,
  ])
}

/** UASTC with rate-distortion optimisation and Zstandard: normals keep their precision. */
export const normalKtx = (input: string, output: string) => {
  ktx([
    '--format',
    'R8G8B8_UNORM',
    '--assign-tf',
    'linear',
    '--encode',
    'uastc',
    '--uastc-quality',
    '2',
    '--uastc-rdo',
    '--uastc-rdo-l',
    '3',
    '--zstd',
    '20',
    '--generate-mipmap',
    input,
    output,
  ])
}

/** ETC1S for linear data that tolerates loss (occlusion, roughness). */
export const linearKtx = (input: string, output: string) => {
  ktx([
    '--format',
    'R8G8B8_UNORM',
    '--assign-tf',
    'linear',
    '--encode',
    'basis-lz',
    '--clevel',
    '2',
    '--qlevel',
    '230',
    '--generate-mipmap',
    input,
    output,
  ])
}
