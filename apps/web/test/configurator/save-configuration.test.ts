import { Configurator, initialConfiguration } from '@kedrovnik/configurator'
import { describe, expect, it } from 'vitest'

import {
  saveConfiguration,
  type SaveDeps,
} from '@/modules/configurator/application/save-configuration'

import {
  MemoryDocuments,
  MemorySavedConfigurations,
  codesFrom,
  configuratorDeps,
} from '../support/fakes'
import { seedModel } from '../support/seed-model'

const model = seedModel('pikhta', 'pikhta-m')
const SAVED_AT = new Date('2026-10-03T09:00:00Z')

function deps(saved = new MemorySavedConfigurations()) {
  const documents = new MemoryDocuments()
  const value: SaveDeps = {
    ...configuratorDeps(model, { pikhta: 'Пихта', 'pikhta-m': 'Пихта М' }),
    saved,
    documents,
    renders: {
      normalise: (image) => Promise.resolve(Buffer.concat([Buffer.from('jpeg:'), image])),
    },
    codes: codesFrom('23456789abcd', 'bcdefghjkmnp'),
    clock: () => SAVED_AT,
  }
  return { value, saved, documents }
}

describe('saveConfiguration', () => {
  const initial = initialConfiguration(model, 'pikhta')

  it('freezes the server-computed estimate, names and tariff revision', async () => {
    const { value, saved, documents } = deps()
    const result = await saveConfiguration(value, {
      configuration: JSON.parse(JSON.stringify(initial)),
      locale: 'ru',
      render: Buffer.from('frame'),
    })
    expect(result).toEqual({ ok: true, code: '23456789abcd' })
    const stored = saved.items.get('23456789abcd')
    const expected = new Configurator(model).quote(initial)
    expect(stored?.snapshot.estimate.total).toBe(expected.estimate.total)
    expect(stored?.snapshot.tariffRevision).toBe(model.grid.revision)
    expect(stored?.snapshot.savedAt).toBe(SAVED_AT.toISOString())
    expect(stored?.snapshot.names.ru?.projects).toEqual({ pikhta: 'Пихта', 'pikhta-m': 'Пихта М' })
    expect(stored?.snapshot.names.en).toBeDefined()
    expect(documents.files.get(stored?.renderId ?? 0)?.data.toString()).toBe('jpeg:frame')
  })

  it('never trusts prices or impossible choices from the browser', async () => {
    const { value, saved } = deps()
    const tampered = { ...initial, roof: 'shed' }
    expect(
      await saveConfiguration(value, { configuration: tampered, locale: 'ru', render: null }),
    ).toEqual({
      ok: false,
      reason: 'invalid',
    })
    expect(
      await saveConfiguration(value, {
        configuration: { roof: 'gable' },
        locale: 'ru',
        render: null,
      }),
    ).toEqual({ ok: false, reason: 'invalid' })
    expect(
      await saveConfiguration(value, {
        configuration: { ...initial, colour: '#123456' },
        locale: 'ru',
        render: null,
      }),
    ).toEqual({ ok: false, reason: 'invalid' })
    expect(saved.items.size).toBe(0)
  })

  it('answers for projects that are not published', async () => {
    const { value } = deps()
    expect(
      await saveConfiguration(value, {
        configuration: { ...initial, project: 'sosny' },
        locale: 'ru',
        render: null,
      }),
    ).toEqual({ ok: false, reason: 'unavailable' })
  })

  it('draws another code when a code is already taken', async () => {
    const saved = new MemorySavedConfigurations()
    saved.collideOnce = true
    const { value } = deps(saved)
    const result = await saveConfiguration(value, {
      configuration: initial,
      locale: 'en',
      render: null,
    })
    expect(result).toEqual({ ok: true, code: 'bcdefghjkmnp' })
    expect(saved.items.get('bcdefghjkmnp')?.renderId).toBeNull()
  })
})
