/**
 * Renders catalog images from the site's own 3D scene into seed-assets/renders.
 * Needs the site running (`pnpm dev`); run with `pnpm render:covers`, then `pnpm seed`.
 */
import { mkdirSync } from 'node:fs'

import { chromium } from 'playwright'
import sharp from 'sharp'

import { env } from '@/config/env'
import { RENDER_READY_ATTRIBUTE } from '@/modules/house-3d/domain/render'
import { BUILT_OBJECTS } from '@/seed/data/places'
import { GALLERY_RENDERS, RENDER_SIZE, projectRenderName } from '@/seed/data/renders'
import { RENDER_DIRECTORY, renderFile } from '@/seed/steps/media'
import { PROJECTS } from '@/seed/steps/projects'

const WEBP = { quality: 86, alphaQuality: 92, effort: 5 } as const
const READY_TIMEOUT_MS = 180_000

interface RenderJob {
  readonly name: string
  readonly path: string
}

const jobs: RenderJob[] = [
  ...PROJECTS.flatMap((project) =>
    GALLERY_RENDERS.map(({ view, camera }) => ({
      name: projectRenderName(project.slug, view),
      path: `/render/${project.slug}?view=${camera}`,
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
const browser = await chromium.launch({
  args: ['--mute-audio', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
try {
  const context = await browser.newContext({ viewport: RENDER_SIZE, deviceScaleFactor: 1 })
  for (const job of selected) {
    const started = Date.now()
    const page = await context.newPage()
    await page.goto(new URL(job.path, base).toString(), { waitUntil: 'domcontentloaded' })
    await page.waitForSelector(`html[${RENDER_READY_ATTRIBUTE}="true"]`, {
      timeout: READY_TIMEOUT_MS,
    })
    const png = await page.screenshot({ omitBackground: true, type: 'png' })
    await sharp(png).webp(WEBP).toFile(renderFile(job.name))
    console.log(`${job.name} (${Math.round((Date.now() - started) / 1000)} s)`)
    await page.close()
  }
} finally {
  await browser.close()
}
process.exit(0)
