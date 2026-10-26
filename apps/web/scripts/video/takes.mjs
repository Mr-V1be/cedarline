// The takes of the product video, for the landscape (desktop) and the portrait (phone) cut:
// browse — home with the evening scene, catalogue, project page;
// configure — configurator options with camera flights and the live estimate, the PDF
// proposal, the lead and the letter in the demo mailbox.
import { configuratorOption as option, sceneReady } from '../shots/stage.ts'
import { clickOn, glide, scrollBy, tapOn, typeInto } from './pointer.mjs'

export const PROJECT = 'listvennitsa'

const pause = (page, ms) => page.waitForTimeout(ms)

async function browseDesktop(page, take, base) {
  await page.goto(`${base}/`, { waitUntil: 'networkidle' })
  await sceneReady(page)
  take.mark('start')
  await glide(page, 900, 420, 1)
  await pause(page, 1300)
  // A slow orbit around the evening house.
  const canvas = page.locator('main canvas').first()
  const box = await canvas.boundingBox()
  if (box !== null) {
    await glide(page, box.x + box.width * 0.55, box.y + box.height * 0.5, 400)
    await page.mouse.down()
    await glide(page, box.x + box.width * 0.3, box.y + box.height * 0.47, 1500)
    await page.mouse.up()
  }
  await pause(page, 700)
  await scrollBy(page, 760, 1200)
  await pause(page, 900)
  await clickOn(
    page,
    page
      .getByRole('navigation', { name: 'Основная навигация' })
      .getByRole('link', { name: 'Проекты' }),
  )
  await page.waitForURL(/\/projects$/)
  await page.waitForLoadState('networkidle')
  await pause(page, 900)
  await scrollBy(page, 420, 1000)
  await pause(page, 400)
  await clickOn(page, page.locator(`main a[href$="/projects/${PROJECT}"]`).first())
  await page.waitForURL(new RegExp(`/projects/${PROJECT}$`))
  await page.waitForLoadState('networkidle')
  await pause(page, 1000)
  const next = page.getByRole('button', { name: 'Следующее изображение' })
  await clickOn(page, next, { pause: 120 })
  await pause(page, 800)
  await clickOn(page, next, { pause: 120 })
  await pause(page, 900)
  await scrollBy(page, 1250, 1400)
  await pause(page, 1800)
  await scrollBy(page, 900, 1200)
  await pause(page, 1200)
  await clickOn(page, page.locator(`a[href$="/configurator/${PROJECT}"]:visible`).last())
  await page.waitForURL(new RegExp(`/configurator/${PROJECT}`))
  await pause(page, 400)
}

async function browsePhone(page, take, base) {
  await page.goto(`${base}/`, { waitUntil: 'networkidle' })
  await pause(page, 800)
  take.mark('start')
  await pause(page, 1200)
  await tapOn(page, page.getByRole('button', { name: 'Открыть 3D-модель' }).first())
  await sceneReady(page)
  await pause(page, 800)
  await scrollBy(page, 900, 1600)
  await pause(page, 1300)
  await tapOn(page, page.getByRole('button', { name: 'Открыть меню' }))
  await pause(page, 900)
  await tapOn(page, page.locator('dialog[open] nav a[href$="/projects"]'))
  await page.waitForURL(/\/projects$/)
  await page.waitForLoadState('networkidle')
  await pause(page, 1400)
  await scrollBy(page, 520, 1300)
  await pause(page, 900)
  await tapOn(page, page.locator(`main a[href$="/projects/${PROJECT}"]`).first())
  await page.waitForURL(new RegExp(`/projects/${PROJECT}$`))
  await page.waitForLoadState('networkidle')
  await pause(page, 1500)
  // Swipe through the gallery.
  const track = page.locator('[aria-roledescription="carousel"] [role="region"]').first()
  for (let slide = 1; slide <= 2; slide++) {
    await track.evaluate((element, index) => {
      element.scrollTo({ left: element.clientWidth * index, behavior: 'smooth' })
    }, slide)
    await pause(page, 1200)
  }
  await scrollBy(page, 1100, 1700)
  await pause(page, 1600)
  await tapOn(page, page.locator(`a[href$="/configurator/${PROJECT}"]:visible`).last())
  await page.waitForURL(new RegExp(`/configurator/${PROJECT}`))
  await pause(page, 600)
}

/** The options the video changes, in order, with time for the camera to fly. */
const CHANGES = [
  ['footprint', '16000x7000', 2300],
  ['roof', 'gable', 2300],
  ['facade', 'planken', 700],
  ['colour', '#3a3e3c', 1900],
  ['completeness', 'turnkey', 1500],
]

async function proposalAndLead(page, take, { tap, downloads }) {
  const press = tap ? tapOn : clickOn
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 120000 }),
    press(page, page.getByRole('button', { name: 'КП в PDF' }).first()),
  ])
  await download.saveAs(downloads)
  take.mark('pdf')
  await pause(page, 1200)
  await press(page, page.getByRole('button', { name: 'Оставить заявку' }).first())
  await page.waitForSelector('#lead-form')
  await pause(page, 900)
  await typeInto(page, page.locator('input[name="name"]'), 'Анна Смирнова')
  await typeInto(page, page.locator('input[name="phone"]'), '+7 000 412-37-85')
  await typeInto(page, page.locator('input[name="email"]'), 'anna@example.ru')
  await press(page, page.locator('label:has(input[name="consent"])'), { edge: true })
  await pause(page, 500)
  await press(page, page.getByRole('button', { name: 'Отправить заявку' }))
  await page.waitForSelector('dialog[open] [role="status"]', { timeout: 120000 })
  take.mark('lead')
  await pause(page, 1600)
  const letter = page.locator('dialog[open] a[href*="/mail/"]').first()
  await press(page, letter, { pause: 200 })
  // The letter opens in a new tab for visitors; the take stays in one tab.
  const href = await letter.getAttribute('href')
  await page.goto(`${new URL(page.url()).origin}${href}`, { waitUntil: 'networkidle' })
  take.mark('letter')
  await pause(page, 1600)
  await scrollBy(page, tap ? 700 : 420, 1400)
  await pause(page, 1800)
}

async function configureDesktop(page, take, base, downloads) {
  await page.goto(`${base}/configurator/${PROJECT}`, { waitUntil: 'networkidle' })
  await sceneReady(page)
  take.mark('start')
  await glide(page, 1000, 400, 1)
  await pause(page, 1100)
  for (const [name, value, wait] of CHANGES) {
    await clickOn(page, option(page, name, value))
    await pause(page, wait)
  }
  await proposalAndLead(page, take, { tap: false, downloads })
}

async function configurePhone(page, take, base, downloads) {
  await page.goto(`${base}/configurator/${PROJECT}`, { waitUntil: 'networkidle' })
  await pause(page, 800)
  // The scene starts on the first touch.
  await tapOn(page, page.locator('main').first(), { pause: 100 })
  await sceneReady(page)
  take.mark('start')
  await pause(page, 1200)
  const nextStep = (title) => tapOn(page, page.getByRole('button', { name: title, exact: true }))
  await tapOn(page, option(page, 'footprint', '16000x7000'))
  await pause(page, 2300)
  await nextStep('Кровля')
  await pause(page, 700)
  await tapOn(page, option(page, 'roof', 'gable'))
  await pause(page, 2600)
  await nextStep('Фасад')
  await pause(page, 700)
  await tapOn(page, option(page, 'facade', 'planken'))
  await pause(page, 900)
  await tapOn(page, option(page, 'colour', '#3a3e3c'))
  await pause(page, 2200)
  await nextStep('Окна')
  await pause(page, 700)
  await tapOn(page, option(page, 'windows', 'panoramic'))
  await pause(page, 2200)
  for (const title of ['Терраса', 'Утепление', 'Инженерия']) {
    await nextStep(title)
    await pause(page, 600)
  }
  // The package is chosen with the building services.
  await tapOn(page, option(page, 'completeness', 'turnkey'))
  await pause(page, 1800)
  await nextStep('Итог')
  await pause(page, 900)
  await proposalAndLead(page, take, { tap: true, downloads })
}

export const TAKES = {
  landscape: { browse: browseDesktop, configure: configureDesktop },
  portrait: { browse: browsePhone, configure: configurePhone },
}
