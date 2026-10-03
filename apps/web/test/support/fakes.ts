import type { ConfiguratorModel } from '@kedrovnik/configurator'

import type { ConfiguratorDeps } from '@/modules/configurator/application/configurator-model'
import type { SavedConfiguration } from '@/modules/configurator/domain/snapshot'
import type { DocumentStore, StoredDocument } from '@/modules/configurator/ports/document-store'
import type {
  NewSavedConfiguration,
  SavedConfigurationRepository,
} from '@/modules/configurator/ports/saved-configuration-repository'
import type { ProposalDeps } from '@/modules/proposals/application/proposal-service'
import type { ProposalInput } from '@/modules/proposals/ports/proposal-renderer'

import { SEED_NAMES, layers } from './seed-model'

/** Configurator ports over an in-memory series: what the Payload adapters would return. */
export function configuratorDeps(
  model: ConfiguratorModel,
  titles: Record<string, string> = {},
): ConfiguratorDeps {
  return {
    families: {
      findFamily: (slug) =>
        Promise.resolve(
          model.family.some((member) => member.slug === slug)
            ? {
                requested: slug,
                members: model.family.map((blueprint, index) => ({
                  id: index + 1,
                  title: titles[blueprint.slug] ?? blueprint.slug,
                  cover: null,
                  blueprint,
                })),
              }
            : null,
        ),
    },
    options: {
      load: () =>
        Promise.resolve({
          offer: model.offer,
          colours: SEED_NAMES.colours,
          systems: SEED_NAMES.systems,
          rules: SEED_NAMES.rules,
        }),
    },
    houseContext: {
      load: () =>
        Promise.resolve({
          rooms: model.house.rooms,
          roomNames: {},
          standards: model.house.standards,
        }),
    },
    tariff: () => ({ load: () => Promise.resolve({ grid: model.grid, names: SEED_NAMES.tariff }) }),
    technology: {
      load: () =>
        Promise.resolve({
          layers: layers.map((layer) => ({ ...layer, name: layer.key })),
          insulationOptions: [150, 200],
        }),
    },
  }
}

/** Saved configurations kept in a map, with an optional collision on the first insert. */
export class MemorySavedConfigurations implements SavedConfigurationRepository {
  readonly items = new Map<string, SavedConfiguration>()
  collideOnce = false

  create(configuration: NewSavedConfiguration): Promise<SavedConfiguration> {
    if (this.collideOnce) {
      this.collideOnce = false
      return Promise.reject(new Error('duplicate code'))
    }
    const saved: SavedConfiguration = {
      id: this.items.size + 1,
      code: configuration.code,
      projectSlug: configuration.snapshot.configuration.project,
      locale: configuration.locale,
      snapshot: configuration.snapshot,
      renderId: configuration.renderId,
      proposalId: null,
    }
    this.items.set(saved.code, saved)
    return Promise.resolve(saved)
  }

  findByCode(code: string): Promise<SavedConfiguration | null> {
    return Promise.resolve(this.items.get(code) ?? null)
  }

  attachProposal(id: number, documentId: number): Promise<void> {
    for (const [code, saved] of this.items) {
      if (saved.id === id) this.items.set(code, { ...saved, proposalId: documentId })
    }
    return Promise.resolve()
  }
}

export class MemoryDocuments implements DocumentStore {
  readonly files = new Map<number, { document: StoredDocument; data: Buffer }>()

  save(_kind: string, filename: string, mimeType: string, data: Buffer): Promise<StoredDocument> {
    const document = { id: this.files.size + 1, filename, mimeType }
    this.files.set(document.id, { document, data })
    return Promise.resolve(document)
  }

  read(id: number) {
    return Promise.resolve(this.files.get(id) ?? null)
  }
}

/** A proposal renderer that records its inputs and returns a tiny PDF-looking buffer. */
export function proposalDeps(saved: MemorySavedConfigurations, documents: MemoryDocuments) {
  const rendered: ProposalInput[] = []
  const deps: ProposalDeps = {
    saved,
    documents,
    renderer: {
      render: (input) => {
        rendered.push(input)
        return Promise.resolve(Buffer.from(`%PDF ${input.code} ${input.locale}`))
      },
    },
    site: {
      load: () =>
        Promise.resolve({
          phone: '+7 (812) 000-46-10',
          email: 'hello@kedrovnik.example',
          address: 'Тосно',
          hours: '9–19',
          region: 'СПб',
          location: [30.87, 59.55],
          legal: {
            demo: true,
            name: 'ООО «Кедровник»',
            taxId: '0000000000',
            registrationNumber: '0000000000000',
            privacyEmail: 'privacy@kedrovnik.example',
            privacyEdition: new Date('2026-09-01'),
          },
        }),
    },
    linkTo: (code, locale) =>
      `https://kedrovnik.example${locale === 'ru' ? '' : `/${locale}`}/c/${code}`,
  }
  return { deps, rendered }
}

/** Share codes from a fixed list, for predictable tests. */
export const codesFrom = (...codes: string[]) => {
  let index = 0
  return { next: () => codes[index++ % codes.length] ?? 'xxxxxxxxxxxx' }
}
