// Scene performance on an emulated phone: what the 3D view costs to load and to orbit.
//
// usage: pnpm --filter @kedrovnik/web perf:scene [base url] [page path] [runs]
// Needs Playwright's Chromium (pnpm exec playwright install chromium) and a running site.
//
// The phone is emulated: 390×844 at DPR 3, touch, 4× CPU slowdown, WebGL in SwiftShader. The
// numbers compare builds on the same machine; they are not a model of any particular phone.
/* global window, WebGL2RenderingContext -- `instrument` and the evaluated callbacks run in the page */
import { chromium } from 'playwright'

const [base = 'http://localhost:46100', path = '/configurator/sosny', runsArg = '3'] =
  process.argv.slice(2)
const RUNS = Number(runsArg)
const ORBIT_MS = 4000
const CPU_SLOWDOWN = 4

/** Installed before any page script: counts draws per animation frame and times frames. */
function instrument() {
  const frames = []
  let current = { draws: 0, triangles: 0, start: 0 }
  const TRIANGLES = { 4: 1 / 3, 5: 1, 6: 1 }
  const wrap = (proto, name, countOf) => {
    const original = proto[name]
    proto[name] = function (...args) {
      current.draws += 1
      current.triangles += countOf(args)
      return original.apply(this, args)
    }
  }
  const glProto = WebGL2RenderingContext.prototype
  wrap(glProto, 'drawElements', ([mode, count]) => count * (TRIANGLES[mode] ?? 0))
  wrap(glProto, 'drawArrays', ([mode, , count]) => count * (TRIANGLES[mode] ?? 0))
  wrap(
    glProto,
    'drawElementsInstanced',
    ([mode, count, , , instances]) => count * instances * (TRIANGLES[mode] ?? 0),
  )
  wrap(
    glProto,
    'drawArraysInstanced',
    ([mode, , count, instances]) => count * instances * (TRIANGLES[mode] ?? 0),
  )
  const raf = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = (callback) =>
    raf((time) => {
      current = { draws: 0, triangles: 0, start: performance.now() }
      callback(time)
      if (current.draws > 0) {
        frames.push({
          at: current.start,
          ms: performance.now() - current.start,
          draws: current.draws,
          triangles: current.triangles,
        })
      }
    })
  window.__scenePerf = { frames }
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted.length === 0 ? 0 : sorted[Math.floor(sorted.length / 2)]
}
const p95 = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted.length === 0
    ? 0
    : sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
}

const browser = await chromium.launch({
  args: [
    '--mute-audio',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
})
const results = []
for (let run = 0; run < RUNS; run += 1) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  })
  await context.addInitScript(instrument)
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_SLOWDOWN })
  const started = Date.now()
  await page.goto(base + path, { waitUntil: 'domcontentloaded' })
  // On phones the scene waits for a sign of intent; a tap on the stage gives it at once, so
  // the time below is the scene's own cost, not the wait.
  await page.waitForLoadState('load')
  await page.touchscreen.tap(195, 300)
  await page.waitForSelector('canvas', { timeout: 180000 })
  await page.waitForSelector('[role="progressbar"]', { state: 'detached', timeout: 180000 })
  const readyMs = Date.now() - started
  await page.waitForTimeout(1500)

  const box = await page.locator('canvas').first().boundingBox()
  const before = await page.evaluate(() => window.__scenePerf.frames.length)
  const steps = 60
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const orbitStart = Date.now()
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  for (let step = 1; step <= steps; step += 1) {
    await page.mouse.move(cx + Math.sin((step / steps) * Math.PI * 2) * box.width * 0.35, cy, {
      steps: 1,
    })
    await page.waitForTimeout(ORBIT_MS / steps)
  }
  await page.mouse.up()
  const orbitMs = Date.now() - orbitStart
  const frames = await page.evaluate((from) => window.__scenePerf.frames.slice(from), before)
  const transfer = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .filter((entry) => /\/scene\/|\/_next\/static\/chunks\//.test(entry.name))
      .reduce(
        (sum, entry) => ({
          scene: sum.scene + (entry.name.includes('/scene/') ? entry.encodedBodySize : 0),
          js:
            sum.js +
            (entry.name.includes('/chunks/') && entry.name.endsWith('.js')
              ? entry.encodedBodySize
              : 0),
        }),
        { scene: 0, js: 0 },
      ),
  )
  results.push({
    readyMs,
    fps: frames.length / (orbitMs / 1000),
    frameMsMedian: median(frames.map((frame) => frame.ms)),
    frameMsP95: p95(frames.map((frame) => frame.ms)),
    drawsPerFrame: median(frames.map((frame) => frame.draws)),
    trianglesPerFrame: median(frames.map((frame) => frame.triangles)),
    sceneKB: transfer.scene / 1024,
    jsKB: transfer.js / 1024,
  })
  await context.close()
}
await browser.close()

const keys = Object.keys(results[0])
const summary = Object.fromEntries(
  keys.map((key) => [key, median(results.map((result) => result[key]))]),
)
const round = (value) => (Math.abs(value) >= 100 ? Math.round(value) : Math.round(value * 10) / 10)
process.stdout.write(
  `${JSON.stringify({ path, runs: RUNS, ...Object.fromEntries(Object.entries(summary).map(([k, v]) => [k, round(v)])) }, null, 2)}\n`,
)
