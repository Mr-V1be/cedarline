import { initialConfiguration } from '@kedrovnik/configurator'
import { beforeEach, describe, expect, it } from 'vitest'

import { saveConfiguration } from '@/modules/configurator/application/save-configuration'
import { proposalFor } from '@/modules/proposals/application/proposal-service'

import {
  MemoryDocuments,
  MemorySavedConfigurations,
  codesFrom,
  configuratorDeps,
  proposalDeps,
} from './support/fakes'
import { seedModel } from './support/seed-model'

const model = seedModel('kedr')

describe('proposalFor', () => {
  let saved: MemorySavedConfigurations
  let documents: MemoryDocuments

  beforeEach(async () => {
    saved = new MemorySavedConfigurations()
    documents = new MemoryDocuments()
    await saveConfiguration(
      {
        ...configuratorDeps(model),
        saved,
        documents,
        renders: { normalise: (image) => Promise.resolve(image) },
        codes: codesFrom('kedrkedrkedr'),
        clock: () => new Date('2026-10-03T09:00:00Z'),
      },
      { configuration: initialConfiguration(model), locale: 'ru', render: Buffer.from('jpeg') },
    )
  })

  it('renders the saved language once and keeps the file with the configuration', async () => {
    const { deps, rendered } = proposalDeps(saved, documents)
    const configuration = await saved.findByCode('kedrkedrkedr')
    if (configuration === null) throw new Error('not saved')
    const first = await proposalFor(deps, configuration, 'ru')
    expect(first?.filename).toBe('kedrovnik-kp-kedrkedrkedr.pdf')
    expect(rendered).toHaveLength(1)
    expect(rendered[0]?.render?.toString()).toBe('jpeg')
    expect(rendered[0]?.link).toBe('https://kedrovnik.example/c/kedrkedrkedr')

    const again = await proposalFor(deps, (await saved.findByCode('kedrkedrkedr'))!, 'ru')
    expect(again?.documentId).toBe(first?.documentId)
    expect(rendered).toHaveLength(1)
  })

  it('renders another language on request without storing it', async () => {
    const { deps, rendered } = proposalDeps(saved, documents)
    const configuration = await saved.findByCode('kedrkedrkedr')
    const english = await proposalFor(deps, configuration!, 'en')
    expect(english).toMatchObject({
      documentId: null,
      filename: 'kedrovnik-proposal-kedrkedrkedr-en.pdf',
    })
    expect(rendered[0]?.link).toBe('https://kedrovnik.example/en/c/kedrkedrkedr')
    expect((await saved.findByCode('kedrkedrkedr'))?.proposalId).toBeNull()
  })
})
