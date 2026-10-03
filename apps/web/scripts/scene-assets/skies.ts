import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import sharp, { type Sharp } from 'sharp'

import { PATHS, download, polyhaven, polyhavenAuthors, type SkyRef } from './context.ts'

const SKY_WIDTH = 4096
/** Share of the half-panorama above the horizon over which the grade turns from warm to deep. */
const HORIZON_BAND = 0.85

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
async function horizonColor(image: Sharp): Promise<string> {
  const width = 256
  const height = 128
  const band = { left: 0, top: Math.round(height * 0.46), width, height: Math.round(height * 0.04) }
  const resized = await image.clone().resize(width, height).png().toBuffer()
  const { channels } = await sharp(resized).extract(band).stats()
  return `#${channels
    .slice(0, 3)
    .map((channel) => Math.round(channel.mean).toString(16).padStart(2, '0'))
    .join('')}`
}

/**
 * Multiplies every row of the panorama by a tint that runs from the horizon colour at the
 * middle row to the zenith colour at the top (and back down below the horizon).
 */
async function gradeSky(rgb: Buffer, grade: NonNullable<SkyRef['grade']>): Promise<Buffer> {
  const width = SKY_WIDTH
  const height = SKY_WIDTH / 2
  const out = Buffer.alloc(rgb.length)
  for (let row = 0; row < height; row += 1) {
    const elevation = Math.abs(row / (height - 1) - 0.5) * 2
    const linear = Math.min(1, elevation / HORIZON_BAND)
    const share = linear * linear * (3 - 2 * linear)
    const tint = grade.horizon.map(
      (low, channel) => (low + ((grade.zenith[channel] ?? low) - low) * share) * grade.exposure,
    )
    for (let column = 0; column < width; column += 1) {
      const index = (row * width + column) * 3
      for (let channel = 0; channel < 3; channel += 1) {
        out[index + channel] = Math.min(255, (rgb[index + channel] ?? 0) * (tint[channel] ?? 1))
      }
    }
  }
  return sharp(out, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer()
}

/**
 * A sky: the HDR lights the scene as shot; the background image is the tonemapped panorama with
 * the preset's grade (an evening sky is darkened and warmed to read as dusk).
 */
export async function buildSky(key: string, ref: SkyRef) {
  const files = (await polyhaven(`files/${ref.id}`)) as {
    hdri: Record<string, { hdr: { url: string } }>
    tonemapped: { url: string }
  }
  const hdrUrl = files.hdri['1k']?.hdr.url
  if (hdrUrl === undefined) throw new Error(`No 1k HDR for ${ref.id}`)
  const cache = path.join(PATHS.cache, 'skies')
  const hdr = await download(hdrUrl, path.join(cache, `${ref.id}.hdr`))
  const tonemapped = await download(files.tonemapped.url, path.join(cache, `${ref.id}.jpg`))
  mkdirSync(path.join(PATHS.public, 'hdri'), { recursive: true })
  mkdirSync(path.join(PATHS.public, 'sky'), { recursive: true })
  writeFileSync(path.join(PATHS.public, 'hdri', `${key}.hdr`), readFileSync(hdr))

  const background = sharp(tonemapped, { limitInputPixels: false }).resize(SKY_WIDTH, SKY_WIDTH / 2)
  const graded = sharp(
    ref.grade === undefined
      ? await background.png().toBuffer()
      : await gradeSky(await background.raw().toBuffer(), ref.grade),
  )
  await graded
    .clone()
    .webp({ quality: 80 })
    .toFile(path.join(PATHS.public, 'sky', `${key}.webp`))
  return {
    authors: await polyhavenAuthors(ref.id),
    sun: await brightestDirection(tonemapped),
    horizon: await horizonColor(graded),
  }
}
