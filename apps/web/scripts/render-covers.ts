/**
 * Renders catalog images from the site's own 3D scene into seed-assets/renders.
 * Needs the site running (`pnpm dev`); run with `pnpm render:covers`, then `pnpm seed`.
 */
import { mkdirSync } from 'node:fs'

import { type Browser, chromium } from 'playwright'
import sharp from 'sharp'

import { env } from '@/config/env'
import { RENDER_READY_ATTRIBUTE } from '@/modules/house-3d/domain/render'
import { BUILT_OBJECTS } from '@/seed/data/places'
import { GALLERY_RENDERS, RENDER_SIZE, projectRenderName } from '@/seed/data/renders'
import { RENDER_DIRECTORY, renderFile } from '@/seed/steps/media'
import { PROJECTS } from '@/seed/steps/projects'

const WEBP = { quality: 84, effort: 5 } as const
const READY_TIMEOUT_MS = 600_000

interface RenderJob {
  readonly name: string
  readonly path: string
}

const jobs: RenderJob[] = [
  ...PROJECTS.flatMap((project) =>
    GALLERY_RENDERS.map(({ view, camera, scene }) => ({
      name: projectRenderName(project.slug, view),
      path: `/render/${project.slug}?view=${camera}&scene=${scene}`,
    })),
  ),
  ...BUILT_OBJECTS.map((object) => ({
    name: object.render,
    path: `/render/${object.project}?view=corner&facade=${encodeURIComponent(object.facadeColor)}`,
  })),
]

const only = process.argv.slice(2).filter((argument) => !argument.startsWith('-'))
const selected =
  only.length === 0
    ? jobs
    : jobs.filter((job) => only.some((prefix) => job.name.startsWith(prefix)))
const base = process.env.RENDER_BASE_URL ?? env.SITE_URL

mkdirSync(RENDER_DIRECTORY, { recursive: true })

const LAUNCH_ARGS = ['--mute-audio', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
// A render can fail while the server recompiles or the browser runs out of memory; one retry
// with a fresh browser keeps a batch going.
const ATTEMPTS = 2
// A frame whose channels barely vary is a blank canvas, not a render.
const MIN_CHANNEL_DEVIATION = 6

const isBlank = async (png: Buffer) => {
  const { channels } = await sharp(png).stats()
  return channels.slice(0, 3).every((channel) => channel.stdev < MIN_CHANNEL_DEVIATION)
}

const renderJob = async (browser: Browser, job: RenderJob) => {
  const context = await browser.newContext({ viewport: RENDER_SIZE, deviceScaleFactor: 1 })
  try {
    const page = await context.newPage()
    await page.goto(new URL(job.path, base).toString(), { waitUntil: 'domcontentloaded' })
    await page.waitForSelector(`html[${RENDER_READY_ATTRIBUTE}="true"]`, {
      timeout: READY_TIMEOUT_MS,
    })
    const png = await page.screenshot({ type: 'png' })
    if (await isBlank(png)) throw new Error('the captured frame is blank')
    await sharp(png).webp(WEBP).toFile(renderFile(job.name))
  } finally {
    await context.close().catch(() => undefined)
  }
}

let browser = await chromium.launch({ args: LAUNCH_ARGS })
try {
  for (const job of selected) {
    for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
      const started = Date.now()
      try {
        if (!browser.isConnected()) browser = await chromium.launch({ args: LAUNCH_ARGS })
        await renderJob(browser, job)
        console.log(`${job.name} (${Math.round((Date.now() - started) / 1000)} s)`)
        break
      } catch (error) {
        if (attempt === ATTEMPTS) throw error
        console.warn(`${job.name}: retrying after ${String(error)}`)
      }
    }
  }
} finally {
  await browser.close()
}
process.exit(0)
