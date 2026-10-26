/**
 * The curated stills of the repository, as data: which screen, on which device and theme, in
 * which state. `run.ts` takes a set and writes its files; nothing here touches a browser itself.
 */
import type { Page } from 'playwright'

import { DEVICES, type Device, type Scheme } from './browser.ts'
import { composeCover } from './cover.ts'
import { CAMERA_FLIGHT_MS, chooseOptions, sceneReady, scrollAnchorTo } from './stage.ts'

export interface Shot {
  /** File name inside the set's folder; the extension picks WebP or PNG. */
  readonly file: string
  readonly device: Device
  readonly scheme: Scheme
  /** Address on the site, with the locale prefix for languages other than Russian. */
  readonly path: string
  /** A demo role to sign in to the CMS as first. */
  readonly role?: string
  /** Brings the screen into the state the still shows, after the page has loaded. */
  readonly stage?: (page: Page) => Promise<void>
}

export interface ShotSet {
  /** Folder of the files, relative to the repository root; `null` — given on the command line. */
  readonly folder: string | null
  readonly shots: readonly Shot[]
  /** Images made from the shots once they are written. */
  readonly compose?: (folder: string) => Promise<void>
}

/** The configurator project of the case: a long one-storey house with panoramic windows. */
const CASE_PROJECT = 'listvennitsa'
/** The configuration the product video builds, up to the package. */
const CASE_OPTIONS = [
  ['roof', 'gable'],
  ['facade', 'planken'],
  ['colour', '#3a3e3c'],
] as const
const ESTIMATE_OPTIONS = [
  ['footprint', '16000x7000'],
  ...CASE_OPTIONS,
  ['completeness', 'turnkey'],
] as const
/** Header height on desktops: a block scrolled to this line sits right under the header. */
const UNDER_HEADER = 65

/** Desktop configurator: the panel at the roof and facade steps, the camera on the facade. */
const configuratorAtFacade =
  (options: ReadonlyArray<readonly [string, string]>, roofTop: number) =>
  async (page: Page): Promise<void> => {
    await sceneReady(page, 60_000)
    await chooseOptions(page, options)
    await scrollAnchorTo(
      page.locator('label:has(input[name="configurator-roof"][value="gable"])'),
      roofTop,
    )
    // The camera follows the step in view; the trees of the backdrop stream in after it.
    await page.waitForTimeout(CAMERA_FLIGHT_MS + 3000)
  }

/** The page scrolled so the block starting with `text` sits `top` pixels down the viewport. */
const scrolledTo =
  (text: string, top: number) =>
  async (page: Page): Promise<void> => {
    await scrollAnchorTo(page.getByText(text, { exact: true }), top)
    await page.waitForLoadState('networkidle')
  }

const desktop = (
  file: string,
  path: string,
  stage?: Shot['stage'],
  scheme: Scheme = 'light',
): Shot => ({
  file,
  device: DEVICES.desktop,
  scheme,
  path,
  ...(stage === undefined ? {} : { stage }),
})

const phone = (
  file: string,
  path: string,
  stage?: Shot['stage'],
  scheme: Scheme = 'light',
): Shot => ({
  file,
  device: DEVICES.phone,
  scheme,
  path,
  ...(stage === undefined ? {} : { stage }),
})

const homeScene = async (page: Page) => {
  await sceneReady(page, 60_000)
}

/** The CMS card of the first sample lead, as the sales manager opens it. */
const leadCard = async (page: Page) => {
  await page
    .getByRole('row', { name: /Анна Смирнова/ })
    .getByRole('link')
    .first()
    .click()
  await page.waitForURL(/\/admin\/collections\/leads\/\d+/)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(800)
}

const CASE: ShotSet = {
  folder: 'docs/case/images',
  shots: [
    desktop('desktop-home.webp', '/', homeScene),
    desktop('desktop-home-dark.webp', '/', homeScene, 'dark'),
    desktop(
      'desktop-configurator.webp',
      `/configurator/${CASE_PROJECT}`,
      configuratorAtFacade(CASE_OPTIONS, UNDER_HEADER),
    ),
    desktop('desktop-estimate.webp', `/configurator/${CASE_PROJECT}`, async (page) => {
      await sceneReady(page, 60_000)
      await chooseOptions(page, ESTIMATE_OPTIONS)
      await scrollAnchorTo(page.getByRole('heading', { name: 'Смета', exact: true }), 470)
      await page.waitForTimeout(CAMERA_FLIGHT_MS)
    }),
    desktop('desktop-project.webp', `/projects/${CASE_PROJECT}`),
    desktop('desktop-plan.webp', `/projects/${CASE_PROJECT}`, scrolledTo('Планировка', 100)),
    desktop('desktop-catalog.webp', '/projects'),
    desktop('desktop-objects.webp', '/objects', async (page) => {
      await page.waitForSelector('.maplibregl-canvas', { timeout: 60_000 })
      await page.waitForTimeout(2500)
    }),
    desktop('desktop-calculator.webp', '/calculator'),
    desktop(
      'desktop-article.webp',
      '/articles/insulation-150-or-200',
      scrolledTo('Что меняется в стене', 360),
    ),
    desktop('desktop-production.webp', '/production', scrolledTo('Чертёж и раскладка', 600)),
    {
      ...desktop('desktop-cms-lead.webp', '/admin/collections/leads', leadCard, 'dark'),
      role: 'sales-manager',
    },
    desktop('desktop-demo.webp', '/demo'),
    phone('phone-home.webp', '/'),
    phone('phone-configurator.webp', `/configurator/${CASE_PROJECT}`, async (page) => {
      // Phones start the scene on the first touch, then walk the steps one by one.
      await page.locator('main').first().tap()
      await sceneReady(page, 60_000)
      await page.getByRole('button', { name: 'Кровля', exact: true }).tap()
      await page.waitForTimeout(700)
      await chooseOptions(page, [['roof', 'gable']])
    }),
    phone('phone-catalog.webp', '/projects', scrolledTo('Сосны', 380)),
    phone('phone-objects.webp', '/objects', async (page) => {
      await page.getByRole('button', { name: /Ольха/ }).first().tap()
      await page.waitForSelector('dialog[open]')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(800)
    }),
    phone('phone-calculator.webp', '/calculator', scrolledTo('Ежемесячный платёж', 260)),
    phone('phone-project-dark.webp', '/projects/kedr', undefined, 'dark'),
    phone('phone-article-dark.webp', '/articles/frame-technology', undefined, 'dark'),
  ],
  compose: (folder) =>
    composeCover({
      desktop: `${folder}/desktop-configurator.webp`,
      phone: `${folder}/phone-configurator.webp`,
      output: `${folder}/cover.webp`,
      tagline: '3D-конфигуратор каркасного дома · смета и срок сразу',
    }),
}

/** The real CMS screen on the demo page, in both themes. */
const DEMO: ShotSet = {
  folder: 'apps/web/src/modules/demo/ui/images',
  shots: (['light', 'dark'] as const).map((scheme) => ({
    file: `cms-lead-${scheme}.webp`,
    device: DEVICES.cms,
    scheme,
    path: '/admin/collections/leads',
    role: 'sales-manager',
    stage: leadCard,
  })),
}

/** The configurator in English and dollars, framed as the owner's profile shows it. */
const SHOWCASE: ShotSet = {
  folder: null,
  shots: (['light', 'dark'] as const).map((scheme) => ({
    file: `cedarline-configurator-${scheme}.png`,
    device: DEVICES.retina,
    scheme,
    path: '/en/configurator/sosny',
    stage: configuratorAtFacade([], 82),
  })),
}

export const SHOT_SETS = { case: CASE, demo: DEMO, showcase: SHOWCASE } as const

export type ShotSetName = keyof typeof SHOT_SETS
