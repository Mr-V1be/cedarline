/**
 * Takes a set of curated stills from a running site (a demo stand, for the CMS sign-in).
 * usage: node scripts/shots/run.ts <case|demo|showcase> [--out <folder>] [--base <url>] [--only <file,…>]
 *   case      docs/case/images and the cover
 *   demo      the CMS screen on the demo page (apps/web/src/modules/demo/ui/images)
 *   showcase  the configurator for the owner's profile, into --out
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
} from './browser.ts'
import { SHOT_SETS, type ShotSetName } from './sets.ts'
import { imagesReady } from './stage.ts'

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: 'string' },
    base: { type: 'string', default: 'http://localhost:46100' },
    // Retake some files of the set, e.g. after a change to one screen.
    only: { type: 'string' },
  },
})
const name = positionals[0]
if (name === undefined || !(name in SHOT_SETS)) {
  console.error(
    `usage: node scripts/shots/run.ts <${Object.keys(SHOT_SETS).join('|')}> [--out <folder>] [--base <url>]`,
  )
  process.exit(2)
}
const set = SHOT_SETS[name as ShotSetName]
const root = path.resolve(import.meta.dirname, '../../../..')
const folder = values.out ?? (set.folder === null ? undefined : path.join(root, set.folder))
if (folder === undefined) {
  console.error(`The ${name} set needs --out <folder>.`)
  process.exit(2)
}

const browser = await launchBrowser({ gpu: true })
try {
  const sessions = new Map<string, SessionState>()
  const only = values.only?.split(',')
  for (const shot of set.shots.filter((item) => only === undefined || only.includes(item.file))) {
    let session: SessionState | undefined
    if (shot.role !== undefined) {
      session = sessions.get(shot.role) ?? (await demoSession(browser, values.base, shot.role))
      sessions.set(shot.role, session)
    }
    const context = await newShotContext(browser, shot.device, shot.scheme, session)
    if (session !== undefined) await setCmsTheme(context, values.base, shot.scheme)
    try {
      const page = await context.newPage()
      await page.goto(new URL(shot.path, values.base).toString(), {
        waitUntil: 'networkidle',
        timeout: 120_000,
      })
      await shot.stage?.(page)
      await imagesReady(page)
      const file = path.join(folder, shot.file)
      await saveImage(await page.screenshot(), file)
      console.log(path.relative(root, file))
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
}
await set.compose?.(folder)
