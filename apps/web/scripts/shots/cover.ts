/**
 * The case cover: the wordmark and a line about the product over the configurator on a desktop
 * (in a browser window) and on a phone, on drafting paper. Drawn from the shots and the brand.
 */
import path from 'node:path'

import sharp from 'sharp'

import { BRAND_COLOURS, BRAND_NAME, MARK_GRID, markLines } from '../../src/ui/brand/brand.ts'

const SIZE = { width: 1920, height: 1080 }
const MARGIN = 120
const MUTED = '#59605c'
const BAR = '#e9eae3'
const DOT = '#b4b8ae'
const BROWSER = { left: MARGIN, top: 170, width: 1280, bar: 34, radius: 16 }
const PHONE = { left: 1440, top: 230, width: 400, bezel: 14, radius: 60 }

interface CoverInput {
  readonly desktop: string
  readonly phone: string
  readonly output: string
  readonly tagline: string
}

const escapeXml = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

/** A soft shadow under a rounded box, as a full-canvas layer. */
async function shadow(left: number, top: number, width: number, height: number, radius: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE.width}" height="${SIZE.height}"><rect x="${left}" y="${top + 14}" width="${width}" height="${height}" rx="${radius}" fill="rgba(31,36,33,0.22)"/></svg>`
  return sharp(Buffer.from(svg)).blur(22).png().toBuffer()
}

/** An image cut to a rounded rectangle. */
async function rounded(file: string, width: number, height: number, radius: number) {
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="#fff"/></svg>`,
  )
  return sharp(file)
    .resize(width, height)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()
}

export async function composeCover(input: CoverInput): Promise<void> {
  process.env.FONTCONFIG_FILE ??= path.resolve(import.meta.dirname, '../../assets/fonts/fonts.conf')
  const [desktop, phone] = await Promise.all([
    sharp(input.desktop).metadata(),
    sharp(input.phone).metadata(),
  ])
  const desktopHeight = Math.round((BROWSER.width * desktop.height) / desktop.width)
  const screenWidth = PHONE.width - PHONE.bezel * 2
  const screenHeight = Math.round((screenWidth * phone.height) / phone.width)
  const phoneHeight = screenHeight + PHONE.bezel * 2
  const markSize = 52
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE.width}" height="${SIZE.height}">
    <g transform="translate(${MARGIN} 62) scale(${markSize / MARK_GRID})">${markLines(BRAND_COLOURS.pine)}</g>
    <text x="${MARGIN + markSize + 16}" y="106" font-family="Literata" font-weight="500" font-size="56" fill="${BRAND_COLOURS.ink}">${BRAND_NAME}</text>
    <text x="${SIZE.width - MARGIN}" y="104" text-anchor="end" font-family="Manrope" font-size="30" fill="${MUTED}">${escapeXml(input.tagline)}</text>
    <path d="M${BROWSER.left} ${BROWSER.top + BROWSER.bar}V${BROWSER.top + BROWSER.radius}a${BROWSER.radius} ${BROWSER.radius} 0 0 1 ${BROWSER.radius}-${BROWSER.radius}H${BROWSER.left + BROWSER.width - BROWSER.radius}a${BROWSER.radius} ${BROWSER.radius} 0 0 1 ${BROWSER.radius} ${BROWSER.radius}V${BROWSER.top + BROWSER.bar}Z" fill="${BAR}"/>
    ${[0, 1, 2].map((dot) => `<circle cx="${BROWSER.left + 22 + dot * 20}" cy="${BROWSER.top + BROWSER.bar / 2}" r="6" fill="${DOT}"/>`).join('')}
    <rect x="${PHONE.left}" y="${PHONE.top}" width="${PHONE.width}" height="${phoneHeight}" rx="${PHONE.radius}" fill="${BRAND_COLOURS.ink}"/>
  </svg>`
  await sharp({ create: { ...SIZE, channels: 3, background: BRAND_COLOURS.paper } })
    .composite([
      {
        input: await shadow(
          BROWSER.left,
          BROWSER.top,
          BROWSER.width,
          BROWSER.bar + desktopHeight,
          BROWSER.radius,
        ),
      },
      { input: await shadow(PHONE.left, PHONE.top, PHONE.width, phoneHeight, PHONE.radius) },
      { input: Buffer.from(overlay) },
      {
        input: await sharp(input.desktop).resize(BROWSER.width, desktopHeight).png().toBuffer(),
        left: BROWSER.left,
        top: BROWSER.top + BROWSER.bar,
      },
      {
        input: await rounded(input.phone, screenWidth, screenHeight, PHONE.radius - PHONE.bezel),
        left: PHONE.left + PHONE.bezel,
        top: PHONE.top + PHONE.bezel,
      },
    ])
    .webp({ quality: 85 })
    .toFile(input.output)
}
