import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

import sharp from 'sharp'

import {
  PATHS,
  TEXTURE_TIERS,
  colourKtx,
  download,
  linearKtx,
  normalKtx,
  polyhaven,
  polyhavenAuthors,
  type MaterialRef,
} from './context.ts'

/** Luminance colourable textures are scaled to, so a catalog colour over them reads true. */
const NEUTRAL_MEAN = 0.78

interface Sources {
  readonly color: string
  readonly normal: string
  readonly ao: string
  readonly roughness: string
  readonly authors: string[]
}

async function materialSources(ref: MaterialRef): Promise<Sources> {
  const folder = path.join(PATHS.cache, 'materials', ref.id)
  if (ref.source === 'polyhaven') {
    const files = (await polyhaven(`files/${ref.id}`)) as Record<
      string,
      Record<string, Record<string, { url: string }>>
    >
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
      authors: await polyhavenAuthors(ref.id),
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

async function encodeTier(
  key: string,
  ref: MaterialRef,
  sources: Sources,
  edge: number,
  tier: string,
) {
  const work = path.join(PATHS.cache, 'work', key, tier)
  const out = path.join(PATHS.public, 'textures', key, tier)
  mkdirSync(work, { recursive: true })
  mkdirSync(out, { recursive: true })
  const size = { width: edge, height: edge }

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
  const arm = Buffer.alloc(edge * edge * 3)
  for (let pixel = 0; pixel < edge * edge; pixel += 1) {
    arm[pixel * 3] = ao?.[pixel] ?? 255
    arm[pixel * 3 + 1] = roughness?.[pixel] ?? 200
    arm[pixel * 3 + 2] = 0
  }
  await sharp(arm, { raw: { ...size, channels: 3 } })
    .png()
    .toFile(path.join(work, 'arm.png'))

  colourKtx(path.join(work, 'color.png'), path.join(out, 'color.ktx2'))
  normalKtx(path.join(work, 'normal.png'), path.join(out, 'normal.ktx2'))
  linearKtx(path.join(work, 'arm.png'), path.join(out, 'arm.ktx2'))
}

/** A PBR material in every texture tier. */
export async function buildMaterial(key: string, ref: MaterialRef) {
  const sources = await materialSources(ref)
  for (const [tier, share] of Object.entries(TEXTURE_TIERS)) {
    await encodeTier(key, ref, sources, Math.round(ref.size * share), tier)
  }
  return { authors: sources.authors }
}
