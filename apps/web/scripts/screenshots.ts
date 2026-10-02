/**
 * Captures every screen in the review matrix: phone, tablet and desktop, light and dark.
 * Usage: node scripts/screenshots.ts <output-dir> <base-url> <name=path> [name=path …]
 */
import { mkdirSync } from 'node:fs'
import path from 'node:path'

import { chromium } from 'playwright'

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
] as const
const SCHEMES = ['light', 'dark'] as const

const [outputArgument, baseUrl, ...pages] = process.argv.slice(2)
if (outputArgument === undefined || baseUrl === undefined || pages.length === 0) {
  console.error('Usage: node scripts/screenshots.ts <output-dir> <base-url> <name=path> …')
  process.exit(1)
}
const output = path.resolve(outputArgument)
mkdirSync(output, { recursive: true })

const browser = await chromium.launch({ args: ['--mute-audio'] })
try {
  for (const page of pages) {
    const [name, route] = page.split('=') as [string, string]
    for (const viewport of VIEWPORTS) {
      for (const scheme of SCHEMES) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: 1,
          colorScheme: scheme,
          reducedMotion: 'reduce',
        })
        const tab = await context.newPage()
        await tab.goto(new URL(route, baseUrl).toString(), {
          waitUntil: 'networkidle',
          timeout: 120_000,
        })
        // Scroll through the page so lazy images load, then return to the top.
        await tab.evaluate(async () => {
          const step = window.innerHeight / 2
          for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
            window.scrollTo(0, y)
            await new Promise((resolve) => setTimeout(resolve, 120))
          }
          window.scrollTo(0, 0)
        })
        await tab.waitForLoadState('networkidle')
        await tab.waitForTimeout(800)
        const overflow = await tab.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        const file = path.join(output, `${name}-${viewport.name}-${scheme}.png`)
        await tab.screenshot({ path: file, fullPage: true })
        console.log(`${file}${overflow > 0 ? `  ⚠ horizontal overflow ${overflow}px` : ''}`)
        await context.close()
      }
    }
  }
} finally {
  await browser.close()
}
