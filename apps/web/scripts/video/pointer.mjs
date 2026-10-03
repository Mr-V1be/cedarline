// What the viewer's eye follows in the video: a visible pointer for mouse takes, a ripple for
// taps, and paced movements (Playwright moves the mouse instantly; a viewer needs to see it).

/** Installed in every document of the take: draws the pointer and the tap ripples. */
export function pointerOverlay() {
  const install = () => {
    if (document.getElementById('video-pointer')) return
    const dot = document.createElement('div')
    dot.id = 'video-pointer'
    dot.style.cssText =
      'position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;padding:0;border-radius:50%;' +
      'background:rgba(255,255,255,.9);border:2px solid rgba(31,36,33,.85);box-shadow:0 2px 8px rgba(0,0,0,.3);' +
      'pointer-events:none;z-index:2147483647;transition:transform .12s ease-out;'
    const saved = JSON.parse(sessionStorage.getItem('video-pointer') ?? '[-100,-100]')
    let [x, y] = saved
    let scale = 1
    const place = () => {
      dot.style.transform = `translate(${x}px, ${y}px) scale(${scale})`
    }
    place()
    // A manual popover lives in the top layer: above modal dialogs (sheets) too, as long as it
    // is shown again whenever a dialog opens.
    dot.popover = 'manual'
    dot.style.inset = 'auto'
    document.documentElement.appendChild(dot)
    dot.showPopover()
    new MutationObserver(() => {
      dot.hidePopover()
      dot.showPopover()
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['open'],
      subtree: true,
    })
    addEventListener(
      'pointermove',
      (event) => {
        if (event.pointerType !== 'mouse') return
        x = event.clientX
        y = event.clientY
        sessionStorage.setItem('video-pointer', JSON.stringify([x, y]))
        place()
      },
      true,
    )
    addEventListener(
      'pointerdown',
      (event) => {
        if (event.pointerType === 'mouse') {
          scale = 0.7
          place()
          return
        }
        dot.style.display = 'none'
        const ripple = document.createElement('div')
        ripple.style.cssText =
          `position:fixed;left:${event.clientX - 24}px;top:${event.clientY - 24}px;width:48px;height:48px;` +
          'border-radius:50%;background:rgba(255,255,255,.55);border:2px solid rgba(31,36,33,.6);' +
          'pointer-events:none;z-index:2147483647;transition:transform .45s ease-out,opacity .45s ease-out;'
        ripple.popover = 'manual'
        ripple.style.inset = 'auto'
        ripple.style.margin = '0'
        document.documentElement.appendChild(ripple)
        ripple.showPopover()
        requestAnimationFrame(() => {
          ripple.style.transform = 'scale(1.6)'
          ripple.style.opacity = '0'
        })
        setTimeout(() => ripple.remove(), 600)
      },
      true,
    )
    addEventListener(
      'pointerup',
      () => {
        scale = 1
        place()
      },
      true,
    )
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', install)
  else install()
}

const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2)
const position = new WeakMap()

/** Moves the mouse to (x, y) over `ms`, eased, at about 60 steps a second. */
export async function glide(page, x, y, ms = 600) {
  const [x0, y0] = position.get(page) ?? [x, y]
  const steps = Math.max(1, Math.round(ms / 16))
  for (let step = 1; step <= steps; step++) {
    const k = ease(step / steps)
    await page.mouse.move(x0 + (x - x0) * k, y0 + (y - y0) * k)
    await page.waitForTimeout(16)
  }
  position.set(page, [x, y])
}

/** Scrolls the element into the middle of the view smoothly, unless it is fully in view. */
async function bringIntoView(page, locator) {
  // Hidden: outside the viewport, or covered (e.g. by a sheet's sticky footer).
  const hidden = await locator.evaluate((element) => {
    const box = element.getBoundingClientRect()
    if (box.top < 0 || box.bottom > window.innerHeight) return true
    const top = document.elementFromPoint(
      box.left + Math.min(12, box.width / 2),
      box.top + box.height / 2,
    )
    return top === null || !(element === top || element.contains(top) || top.contains(element))
  })
  if (!hidden) return
  await locator.evaluate((element) =>
    element.scrollIntoView({ behavior: 'smooth', block: 'center' }),
  )
  await page.waitForTimeout(650)
}

/** Brings the element into view smoothly, glides to it and clicks. */
export async function clickOn(page, locator, { pause = 180, edge = false } = {}) {
  await bringIntoView(page, locator)
  // Layout may still settle (smooth scroll, a panel growing): follow the element until it rests.
  for (let attempt = 0; attempt < 4; attempt++) {
    const box = await locator.boundingBox()
    if (box === null) throw new Error('Element to click has no box')
    // `edge`: the start of the element, e.g. a checkbox whose label holds a link.
    const [x, y] = [edge ? box.x + 12 : box.x + box.width / 2, box.y + box.height / 2]
    await glide(page, x, y, attempt === 0 ? 450 : 200)
    await page.waitForTimeout(pause)
    const settled = await locator.boundingBox()
    if (settled !== null && Math.abs(settled.x - box.x) < 2 && Math.abs(settled.y - box.y) < 2)
      break
  }
  await page.mouse.down()
  await page.waitForTimeout(90)
  await page.mouse.up()
}

/** Taps the element after bringing it into view smoothly (touch takes). */
export async function tapOn(page, locator, { pause = 250, edge = false } = {}) {
  await bringIntoView(page, locator)
  await page.waitForTimeout(pause)
  if (!edge) return locator.tap()
  const box = await locator.boundingBox()
  await locator.tap({ position: { x: 12, y: (box?.height ?? 24) / 2 } })
}

/** Scrolls the page by `dy` pixels over `ms`, eased. */
export async function scrollBy(page, dy, ms = 1200) {
  await page.evaluate(
    ([distance, duration]) =>
      new Promise((resolve) => {
        const from = window.scrollY
        const start = performance.now()
        const frame = (now) => {
          const k = Math.min(1, (now - start) / duration)
          const eased = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2
          window.scrollTo(0, from + distance * eased)
          if (k < 1) requestAnimationFrame(frame)
          else resolve()
        }
        requestAnimationFrame(frame)
      }),
    [dy, ms],
  )
}

/** Types like a person: one character at a time. */
export async function typeInto(page, locator, text, delay = 40) {
  await locator.focus()
  await locator.pressSequentially(text, { delay })
}
