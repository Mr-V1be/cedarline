/**
 * Builds the 3D scene assets from their CC0 sources (Poly Haven, ambientCG):
 *   skies     → public/scene/hdri/<key>.hdr (lighting) + public/scene/sky/<key>.webp (background)
 *   materials → public/scene/textures/<key>/{color,normal,arm}.ktx2 (GPU-compressed, mipmapped)
 * and writes src/modules/house-3d/scene/assets/generated.json (sun directions, authors).
 *
 * Needs `ktx` from KTX-Software (v4.4+) and `unzip` on PATH. Usage:
 *   pnpm --filter @kedrovnik/web scene:assets
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import sharp from 'sharp'

interface AssetRef {
  readonly source: 'polyhaven' | 'ambientcg'
  readonly id: string
}
interface MaterialRef extends AssetRef {
  readonly tile: number
  readonly neutral: boolean
  /** Texture edge in pixels: ground materials repeat densely and need less. */
  readonly size: number
}
interface Manifest {
  readonly skies: Record<string, AssetRef>
  readonly materials: Record<string, MaterialRef>
}

const web = path.resolve(import.meta.dirname, '..')
const manifestPath = path.join(web, 'src/modules/house-3d/scene/assets/manifest.json')
const generatedPath = path.join(web, 'src/modules/house-3d/scene/assets/generated.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest
const cache = path.join(web, '.scene-cache')
const publicScene = path.join(web, 'public/scene')
const SKY_WIDTH = 4096
const NEUTRAL_MEAN = 0.78

async function download(url: string, file: string): Promise<string> {
  if (existsSync(file)) return file
  mkdirSync(path.dirname(file), { recursive: true })
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed ${response.status}: ${url}`)
  writeFileSync(file, Buffer.from(await response.arrayBuffer()))
  return file
}

async function polyhaven(endpoint: string): Promise<unknown> {
  const response = await fetch(`https://api.polyhaven.com/${endpoint}`)
  if (!response.ok) throw new Error(`Poly Haven API ${response.status}: ${endpoint}`)
  return response.json()
}

function ktx(args: string[]) {
  execFileSync('ktx', ['create', ...args], { stdio: 'inherit' })
}

/** Direction of the brightest region of an equirectangular image (three.js convention). */
async function brightestDirection(file: string): Promise<[number, number, number]> {
  const width = 512
  const height = 256
  const { data } = await sharp(file)
    .resize(width, height)
    .greyscale()
    .blur(2)
    .raw()
    .toBuffer({ resolveWithObject: true })
  let best = 0
  let index = 0
  for (let pixel = 0; pixel < data.length; pixel += 1) {
    const value = data[pixel] ?? 0
    if (value > best) {
      best = value
      index = pixel
    }
  }
  const u = ((index % width) + 0.5) / width
  const v = 1 - (Math.floor(index / width) + 0.5) / height
  const phi = (u - 0.5) * 2 * Math.PI
  const theta = (v - 0.5) * Math.PI
  return [Math.cos(theta) * Math.cos(phi), Math.sin(theta), Math.cos(theta) * Math.sin(phi)].map(
    (n) => Math.round(n * 1000) / 1000,
  ) as [number, number, number]
}

/** Average colour of the band just above the horizon: the fog colour that blends ground into sky. */
async function horizonColor(file: string): Promise<string> {
  const width = 256
  const height = 128
  const band = { left: 0, top: Math.round(height * 0.46), width, height: Math.round(height * 0.04) }
  const { channels } = await sharp(file).resize(width, height).extract(band).stats()
  return `#${channels
    .slice(0, 3)
    .map((channel) => Math.round(channel.mean).toString(16).padStart(2, '0'))
    .join('')}`
}

async function buildSky(key: string, ref: AssetRef) {
  const files = (await polyhaven(`files/${ref.id}`)) as {
    hdri: Record<string, { hdr: { url: string } }>
    tonemapped: { url: string }
  }
  const info = (await polyhaven(`info/${ref.id}`)) as { authors: Record<string, string> }
  const hdrUrl = files.hdri['1k']?.hdr.url
  if (hdrUrl === undefined) throw new Error(`No 1k HDR for ${ref.id}`)
  const hdr = await download(hdrUrl, path.join(cache, 'skies', `${ref.id}.hdr`))
  const tonemapped = await download(
    files.tonemapped.url,
    path.join(cache, 'skies', `${ref.id}.jpg`),
  )
  mkdirSync(path.join(publicScene, 'hdri'), { recursive: true })
  mkdirSync(path.join(publicScene, 'sky'), { recursive: true })
  writeFileSync(path.join(publicScene, 'hdri', `${key}.hdr`), readFileSync(hdr))
  await sharp(tonemapped, { limitInputPixels: false })
    .resize(SKY_WIDTH, SKY_WIDTH / 2)
    .webp({ quality: 80 })
    .toFile(path.join(publicScene, 'sky', `${key}.webp`))
  return {
    authors: Object.keys(info.authors),
    sun: await brightestDirection(tonemapped),
    horizon: await horizonColor(tonemapped),
  }
}

async function materialSources(
  ref: MaterialRef,
): Promise<{ color: string; normal: string; ao: string; roughness: string; authors: string[] }> {
  const folder = path.join(cache, 'materials', ref.id)
  if (ref.source === 'polyhaven') {
    const files = (await polyhaven(`files/${ref.id}`)) as Record<
      string,
      Record<string, Record<string, { url: string }>>
    >
    const info = (await polyhaven(`info/${ref.id}`)) as { authors: Record<string, string> }
    const map = async (name: string) => {
      const url = files[name]?.['1k']?.jpg?.url
      if (url === undefined) throw new Error(`No 1k ${name} for ${ref.id}`)
      return download(url, path.join(folder, `${name}.jpg`))
    }
    return {
      color: await map('Diffuse'),
      normal: await map('nor_gl'),
      ao: await map('AO'),
      roughness: await map('Rough'),
      authors: Object.keys(info.authors),
    }
  }
  const zip = await download(
    `https://ambientcg.com/get?file=${ref.id}_1K-JPG.zip`,
    path.join(folder, `${ref.id}.zip`),
  )
  execFileSync('unzip', ['-o', '-q', zip, '-d', folder])
  const file = (suffix: string) => path.join(folder, `${ref.id}_1K-JPG_${suffix}.jpg`)
  return {
    color: file('Color'),
    normal: file('NormalGL'),
    ao: file('AmbientOcclusion'),
    roughness: file('Roughness'),
    authors: ['ambientCG'],
  }
}

async function buildMaterial(key: string, ref: MaterialRef) {
  const sources = await materialSources(ref)
  const work = path.join(cache, 'work', key)
  const out = path.join(publicScene, 'textures', key)
  mkdirSync(work, { recursive: true })
  mkdirSync(out, { recursive: true })
  const size = { width: ref.size, height: ref.size }

  // Colourable surfaces keep only their luminance, scaled to a known mean, so a catalog colour
  // multiplied over them reproduces that colour with the material's grain.
  let color = sharp(sources.color).resize(size)
  if (ref.neutral) {
    const { channels } = await sharp(sources.color).greyscale().stats()
    const mean = (channels[0]?.mean ?? 128) / 255
    color = color
      .greyscale()
      .linear(NEUTRAL_MEAN / mean, 0)
      .toColourspace('srgb')
  }
  await color.removeAlpha().png().toFile(path.join(work, 'color.png'))
  await sharp(sources.normal).resize(size).removeAlpha().png().toFile(path.join(work, 'normal.png'))
  // glTF-style ARM: occlusion in red, roughness in green, metalness (none) in blue.
  const [ao, roughness] = await Promise.all(
    [sources.ao, sources.roughness].map((file) =>
      sharp(file).resize(size).greyscale().raw().toBuffer(),
    ),
  )
  const arm = Buffer.alloc(ref.size * ref.size * 3)
  for (let pixel = 0; pixel < ref.size * ref.size; pixel += 1) {
    arm[pixel * 3] = ao?.[pixel] ?? 255
    arm[pixel * 3 + 1] = roughness?.[pixel] ?? 200
    arm[pixel * 3 + 2] = 0
  }
  await sharp(arm, { raw: { ...size, channels: 3 } })
    .png()
    .toFile(path.join(work, 'arm.png'))

  ktx([
    '--format',
    'R8G8B8_SRGB',
    '--assign-tf',
    'srgb',
    '--encode',
    'basis-lz',
    '--clevel',
    '2',
    '--qlevel',
    '200',
    '--generate-mipmap',
    path.join(work, 'color.png'),
    path.join(out, 'color.ktx2'),
  ])
  // Normals keep UASTC quality; rate-distortion optimisation plus Zstandard keeps them small.
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
    path.join(work, 'normal.png'),
    path.join(out, 'normal.ktx2'),
  ])
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
    path.join(work, 'arm.png'),
    path.join(out, 'arm.ktx2'),
  ])
  return { authors: sources.authors }
}

/** The Basis Universal transcoder ships with three.js; the site serves its own copy. */
function copyTranscoder() {
  const source = path.join(web, 'node_modules/three/examples/jsm/libs/basis')
  const target = path.join(publicScene, 'basis')
  mkdirSync(target, { recursive: true })
  for (const file of ['basis_transcoder.js', 'basis_transcoder.wasm']) {
    writeFileSync(path.join(target, file), readFileSync(path.join(source, file)))
  }
}

copyTranscoder()
const generated: { skies: Record<string, unknown>; materials: Record<string, unknown> } = {
  skies: {},
  materials: {},
}
for (const [key, ref] of Object.entries(manifest.skies)) {
  generated.skies[key] = await buildSky(key, ref)
  console.log(`sky ${key}`)
}
for (const [key, ref] of Object.entries(manifest.materials)) {
  generated.materials[key] = await buildMaterial(key, ref)
  console.log(`material ${key}`)
}
writeFileSync(generatedPath, `${JSON.stringify(generated, null, 2)}\n`)
