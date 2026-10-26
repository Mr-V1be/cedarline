/**
 * Captures every screen in the review matrix: phone, tablet and desktop, light and dark, the
 * whole page, as WebP. `--as <demo role>` signs in to the CMS first (demo stands only);
 * `--fold` keeps the first screen only, for pages with a map: the full-page capture resizes the
 * page, and the map's canvas is blank until it redraws.
 * Usage: node scripts/screenshots.ts <output-dir> <base-url> [--as <role>] [--fold] <name=path> …
 */
import path from 'node:path'
import { parseArgs } from 'node:util'

import {
  demoSession,
  launchBrowser,
  newShotContext,
  saveImage,
  setCmsTheme,
  type SessionState,
} from './shots/browser.ts'

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844, scale: 1 },
  { name: 'tablet', width: 768, height: 1024, scale: 1 },
  { name: 'desktop', width: 1280, height: 800, scale: 1 },
] as const
const SCHEMES = ['light', 'dark'] as const

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { as: { type: 'string' }, fold: { type: 'boolean', default: false } },
})
const [outputArgument, baseUrl, ...pages] = positionals
if (outputArgument === undefined || baseUrl === undefined || pages.length === 0) {
  console.error(
    'Usage: node scripts/screenshots.ts <output-dir> <base-url> [--as <role>] [--fold] <name=path> …',
  )
  process.exit(1)
}
const output = path.resolve(outputArgument)

const browser = await launchBrowser({ gpu: true })
try {
  const session: SessionState | undefined =
    values.as === undefined ? undefined : await demoSession(browser, baseUrl, values.as)
  for (const page of pages) {
    const separator = page.indexOf('=')
    const name = page.slice(0, separator)
    const route = page.slice(separator + 1)
    for (const viewport of VIEWPORTS) {
      for (const scheme of SCHEMES) {
        const context = await newShotContext(browser, viewport, scheme, session)
        await setCmsTheme(context, baseUrl, scheme)
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
        const file = path.join(output, `${name}-${viewport.name}-${scheme}.webp`)
        await saveImage(await tab.screenshot({ fullPage: !values.fold }), file)
        console.log(`${file}${overflow > 0 ? `  ⚠ horizontal overflow ${overflow}px` : ''}`)
        await context.close()
      }
    }
  }
} finally {
  await browser.close()
}
