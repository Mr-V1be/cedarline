import { initialConfiguration } from '@kedrovnik/configurator'
import { describe, expect, it } from 'vitest'

import { openConfigurator } from '@/modules/configurator/application/open-configurator'

import { configuratorDeps } from '../support/fakes'
import { seedModel } from '../support/seed-model'

const model = seedModel('yasen', 'yasen-2')
const deps = configuratorDeps(model, { yasen: 'Ясень', 'yasen-2': 'Ясень 2' })

describe('openConfigurator', () => {
  it('opens a series member with its defaults and the wall to draw', async () => {
    const view = await openConfigurator(deps, 'yasen-2', 'ru')
    expect(view?.initial.project).toBe('yasen-2')
    expect(view?.members.map((member) => member.title)).toEqual(['Ясень', 'Ясень 2'])
    expect(view?.wallLayers.length).toBeGreaterThan(0)
    expect(view?.restoredWithChanges).toBe(false)
  })

  it('continues from a saved configuration that is still possible', async () => {
    const start = { ...initialConfiguration(model, 'yasen'), insulation: 200 }
    const view = await openConfigurator(deps, 'yasen', 'ru', start)
    expect(view?.initial).toEqual(start)
    expect(view?.restoredWithChanges).toBe(false)
  })

  it('falls back to the defaults when the catalog no longer allows the saved choices', async () => {
    const stale = { ...initialConfiguration(model, 'yasen'), colour: '#000000' }
    const view = await openConfigurator(deps, 'yasen', 'ru', stale)
    expect(view?.initial).toEqual(initialConfiguration(model, 'yasen'))
    expect(view?.restoredWithChanges).toBe(true)
  })

  it('does not open unpublished projects', async () => {
    expect(await openConfigurator(deps, 'kedr', 'ru')).toBeNull()
  })
})
