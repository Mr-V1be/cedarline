/**
 * The browser side of every still the repository keeps: devices, contexts, the demo sign-in and
 * image files. Used by the review matrix (scripts/screenshots.ts) and the curated shots.
 */
import { mkdirSync } from 'node:fs'
import path from 'node:path'

import { type Browser, type BrowserContext, chromium } from 'playwright'
import sharp from 'sharp'

export type Scheme = 'light' | 'dark'

export interface Device {
  readonly width: number
  readonly height: number
  readonly scale: number
  /** A touch phone: the site starts heavy parts (3D, map) on the first touch. */
  readonly touch?: boolean
}

export const DEVICES = {
  desktop: { width: 1440, height: 900, scale: 1 },
  /** The same desktop at twice the pixels, for images shown large (profile showcase). */
  retina: { width: 1440, height: 900, scale: 2 },
  phone: { width: 390, height: 844, scale: 2, touch: true },
  cms: { width: 1280, height: 800, scale: 1 },
} as const satisfies Record<string, Device>

/**
 * Headless Chromium with sound off. `gpu` draws WebGL on the graphics card, so 3D scenes look
 * as they do for visitors and render in seconds rather than minutes.
 */
export function launchBrowser({ gpu }: { readonly gpu: boolean }): Promise<Browser> {
  const graphics = gpu
    ? ['--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist']
    : []
  return chromium.launch({ args: ['--mute-audio', ...graphics] })
}

export type SessionState = Awaited<ReturnType<BrowserContext['storageState']>>

export function newShotContext(
  browser: Browser,
  device: Device,
  scheme: Scheme,
  session?: SessionState,
): Promise<BrowserContext> {
  return browser.newContext({
    viewport: { width: device.width, height: device.height },
    deviceScaleFactor: device.scale,
    isMobile: device.touch ?? false,
    hasTouch: device.touch ?? false,
    colorScheme: scheme,
    reducedMotion: 'reduce',
    ...(session === undefined ? {} : { storageState: session }),
  })
}

/**
 * Signs in to the CMS as a demo role through the demo page's one-click form (demo stands only)
 * and returns the session, so every later context starts signed in without another sign-in.
 */
export async function demoSession(
  browser: Browser,
  base: string,
  role: string,
): Promise<SessionState> {
  const context = await browser.newContext()
  try {
    const page = await context.newPage()
    await page.goto(new URL('/demo', base).toString(), { waitUntil: 'networkidle' })
    await page
      .locator(`form:has(input[name="role"][value="${role}"]) button[type="submit"]`)
      .first()
      .click()
    await page.waitForURL(/\/admin/, { timeout: 60_000 })
    return await context.storageState()
  } finally {
    await context.close()
  }
}

/** The CMS keeps its theme in a cookie rather than following the system: set it per context. */
export async function setCmsTheme(
  context: BrowserContext,
  base: string,
  scheme: Scheme,
): Promise<void> {
  await context.addCookies([{ name: 'payload-theme', value: scheme, url: base }])
}

const WEBP_QUALITY = 82

/** Writes a screenshot as WebP (documentation, product images) or PNG, by the file's extension. */
export async function saveImage(image: Buffer, file: string): Promise<void> {
  mkdirSync(path.dirname(file), { recursive: true })
  const encoder = sharp(image)
  await (
    path.extname(file) === '.png'
      ? encoder.png({ compressionLevel: 9 })
      : encoder.webp({ quality: WEBP_QUALITY })
  ).toFile(file)
}
