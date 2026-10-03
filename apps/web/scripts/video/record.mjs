// Records one take of the product video against a running site (GPU-backed headless Chromium,
// one short run per take). Frames and markers go to .run/video/<format>/<take>/.
//
// usage: node scripts/video/record.mjs <landscape|portrait> <browse|configure> [base url]
import { rmSync } from 'node:fs'
import path from 'node:path'

import { chromium } from 'playwright'

import { startCapture } from './capture.mjs'
import { pointerOverlay } from './pointer.mjs'
import { TAKES } from './takes.mjs'

/** Landscape is the desktop site, portrait the phone site; both are recorded at full HD. */
export const FORMATS = {
  landscape: {
    context: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 },
    frame: { width: 1920, height: 1080 },
  },
  portrait: {
    context: {
      viewport: { width: 432, height: 768 },
      deviceScaleFactor: 2.5,
      isMobile: true,
      hasTouch: true,
    },
    frame: { width: 1080, height: 1920 },
  },
}

const [format, takeName, base = 'http://localhost:46100'] = process.argv.slice(2)
const setup = FORMATS[format]
const take = TAKES[format]?.[takeName]
if (setup === undefined || take === undefined) {
  console.error('usage: record.mjs <landscape|portrait> <browse|configure> [base url]')
  process.exit(2)
}

const directory = path.resolve(import.meta.dirname, '../../../../.run/video', format, takeName)
rmSync(directory, { recursive: true, force: true })

// The GPU draws the scene so that camera flights are smooth; runs are short (under two minutes).
const browser = await chromium.launch({
  args: [
    '--mute-audio',
    '--use-angle=vulkan',
    '--enable-features=Vulkan',
    '--ignore-gpu-blocklist',
  ],
})
const context = await browser.newContext({
  ...setup.context,
  locale: 'ru-RU',
  colorScheme: 'light',
  acceptDownloads: true,
})
await context.addInitScript(pointerOverlay)
const page = await context.newPage()
const capture = await startCapture(page, path.join(directory, 'frames'), setup.frame)
try {
  await take(page, capture, base, path.join(directory, 'proposal.pdf'))
} finally {
  const result = await capture.stop()
  console.log(
    `${format}/${takeName}: ${result.frames} frames, ${result.duration.toFixed(1)} s`,
    result.markers,
  )
  await browser.close()
}
