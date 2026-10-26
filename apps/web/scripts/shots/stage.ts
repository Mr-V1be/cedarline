/**
 * Page actions that bring a screen into the state a still shows: the 3D scene drawn, the
 * configurator's options chosen, a block scrolled into place. Shared with the video takes.
 */
import type { Locator, Page } from 'playwright'

/** Time for the camera to finish a flight after the configurator follows a new step. */
export const CAMERA_FLIGHT_MS = 2600

/** Waits until the page's 3D scene is drawn (the canvas has replaced the poster). */
export async function sceneReady(page: Page, timeout = 30_000): Promise<void> {
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector('main canvas')
      return canvas !== null && canvas.getBoundingClientRect().height > 100
    },
    undefined,
    { timeout },
  )
  await page.waitForTimeout(2500)
}

/** An option of the configurator, by its field and value. */
export const configuratorOption = (page: Page, name: string, value: string): Locator =>
  page.locator(`label:has(input[name="configurator-${name}"][value="${value}"])`)

/** Chooses options in order, giving the camera time to fly to each changed part. */
export async function chooseOptions(
  page: Page,
  options: ReadonlyArray<readonly [name: string, value: string]>,
): Promise<void> {
  for (const [name, value] of options) {
    await configuratorOption(page, name, value).click()
    await page.waitForTimeout(CAMERA_FLIGHT_MS)
  }
}

/**
 * Scrolls the nearest scrollable box around `anchor` (the page itself if there is none) so the
 * anchor's top edge lands `top` CSS pixels below the top of the viewport.
 */
export async function scrollAnchorTo(anchor: Locator, top: number): Promise<void> {
  await anchor
    .filter({ visible: true })
    .first()
    .evaluate((element, target) => {
      let box: HTMLElement | null = element.parentElement
      while (
        box !== null &&
        !(box.scrollHeight > box.clientHeight && getComputedStyle(box).overflowY !== 'visible')
      ) {
        box = box.parentElement
      }
      const shift = element.getBoundingClientRect().top - target
      if (box === null || box === document.body || box === document.documentElement) {
        window.scrollBy({ top: shift, behavior: 'instant' })
      } else {
        box.scrollBy({ top: shift, behavior: 'instant' })
      }
    }, top)
  await anchor.page().waitForTimeout(400)
}

/** Waits until every image in view has loaded, so no still catches a placeholder. */
export async function imagesReady(page: Page, timeout = 30_000): Promise<void> {
  await page.waitForFunction(
    () =>
      [...document.images].every((image) => {
        const box = image.getBoundingClientRect()
        const inView = box.bottom > 0 && box.top < window.innerHeight && box.width > 0
        return !inView || (image.complete && image.naturalWidth > 0)
      }),
    undefined,
    { timeout },
  )
  await page.waitForTimeout(300)
}
