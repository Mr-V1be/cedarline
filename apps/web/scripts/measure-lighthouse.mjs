// Lighthouse on mobile for the public pages: median of several runs per page.
//
// usage: pnpm --filter @kedrovnik/web perf:lighthouse [base url] [runs] [output json] [paths…]
// Needs a production build (`pnpm build && pnpm start`) and Playwright's Chromium.
//
// Lighthouse's default mobile profile: Moto G Power viewport, simulated slow 4G and a 4× CPU
// slowdown. The machine is shared, so a page is measured several times and the median run (by
// performance score) is reported.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
import { chromium } from 'playwright'

const DEFAULT_PATHS = ['/', '/projects', '/projects/sosny', '/configurator/sosny']
const [base = 'http://localhost:46100', runsArg = '3', output = '', ...rest] = process.argv.slice(2)
const RUNS = Number(runsArg)
const PATHS = rest.length > 0 ? rest : DEFAULT_PATHS
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']
const METRICS = {
  fcp: 'first-contentful-paint',
  lcp: 'largest-contentful-paint',
  tbt: 'total-blocking-time',
  cls: 'cumulative-layout-shift',
  si: 'speed-index',
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

async function measure(port, url) {
  const result = await lighthouse(url, {
    port,
    output: 'json',
    logLevel: 'error',
    onlyCategories: CATEGORIES,
  })
  if (result === undefined) throw new Error(`Lighthouse returned nothing for ${url}`)
  const { categories, audits } = result.lhr
  return {
    scores: Object.fromEntries(
      CATEGORIES.map((key) => [key, Math.round((categories[key]?.score ?? 0) * 100)]),
    ),
    metrics: Object.fromEntries(
      Object.entries(METRICS).map(([key, audit]) => [key, audits[audit]?.numericValue ?? 0]),
    ),
  }
}

const chrome = await launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ['--headless=new', '--mute-audio', '--no-first-run'],
})
const report = []
try {
  for (const path of PATHS) {
    const url = new URL(path, base).toString()
    const runs = []
    for (let run = 0; run < RUNS; run += 1) runs.push(await measure(chrome.port, url))
    const performance = median(runs.map((item) => item.scores.performance))
    const chosen = runs.find((item) => item.scores.performance === performance) ?? runs[0]
    report.push({ path, runs: runs.map((item) => item.scores.performance), ...chosen })
    process.stdout.write(`${path}: ${runs.map((item) => item.scores.performance).join(', ')}\n`)
  }
} finally {
  await chrome.kill()
}

const ms = (value) => `${(value / 1000).toFixed(1)} s`
const lines = [
  '| Страница | Perf (прогоны) | A11y | BP | SEO | FCP | LCP | TBT | CLS |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...report.map(
    ({ path, runs, scores, metrics }) =>
      `| \`${path}\` | ${scores.performance} (${runs.join(', ')}) | ${scores.accessibility} | ` +
      `${scores['best-practices']} | ${scores.seo} | ${ms(metrics.fcp)} | ${ms(metrics.lcp)} | ` +
      `${Math.round(metrics.tbt)} ms | ${metrics.cls.toFixed(3)} |`,
  ),
]
process.stdout.write(`\n${lines.join('\n')}\n`)
if (output !== '') {
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, `${JSON.stringify({ base, runs: RUNS, report }, null, 2)}\n`)
}
