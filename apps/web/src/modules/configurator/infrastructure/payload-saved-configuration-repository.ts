import type { Payload } from 'payload'

import type { Configuration as ConfigurationDocument } from '@/cms/generated/payload-types'
import { isLocale } from '@/i18n/locales'
import { relationId } from '@/modules/catalog/infrastructure/project-design-mapper'
import { Money } from '@kedrovnik/pricing'

import {
  SNAPSHOT_VERSION,
  type ConfigurationSnapshot,
  type SavedConfiguration,
} from '../domain/snapshot'
import type {
  NewSavedConfiguration,
  SavedConfigurationRepository,
} from '../ports/saved-configuration-repository'

/** Saved configurations are not public documents: the site reads them by code on its own. */
const SYSTEM = { overrideAccess: true, depth: 1 } as const

function isSnapshot(value: unknown): value is ConfigurationSnapshot {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { version?: unknown }).version === SNAPSHOT_VERSION
  )
}

type StoredDocument = Pick<
  ConfigurationDocument,
  'id' | 'code' | 'project' | 'locale' | 'snapshot' | 'render' | 'proposal'
>

function toSaved(document: StoredDocument): SavedConfiguration | null {
  const project = document.project
  const snapshot: unknown = document.snapshot
  if (!isSnapshot(snapshot) || typeof project !== 'object' || project === null) return null
  return {
    id: document.id,
    code: document.code,
    projectSlug: project.slug,
    locale:
      document.locale !== null && document.locale !== undefined && isLocale(document.locale)
        ? document.locale
        : 'ru',
    snapshot,
    renderId:
      document.render === null || document.render === undefined
        ? null
        : relationId(document.render),
    proposalId:
      document.proposal === null || document.proposal === undefined
        ? null
        : relationId(document.proposal),
  }
}

export class PayloadSavedConfigurationRepository implements SavedConfigurationRepository {
  constructor(private readonly payload: Payload) {}

  async create(configuration: NewSavedConfiguration): Promise<SavedConfiguration> {
    const { snapshot } = configuration
    const document = await this.payload.create({
      ...SYSTEM,
      collection: 'configurations',
      data: {
        code: configuration.code,
        project: configuration.projectId,
        locale: configuration.locale,
        total: Money.toWholeRubles(snapshot.estimate.total),
        tariffRevision: snapshot.tariffRevision,
        configuration: snapshot.configuration as unknown as Record<string, unknown>,
        snapshot: snapshot as unknown as Record<string, unknown>,
        ...(configuration.renderId === null ? {} : { render: configuration.renderId }),
      },
    })
    const saved = toSaved(document)
    if (saved === null) throw new Error(`Configuration ${configuration.code} was not stored`)
    return saved
  }

  async findByCode(code: string): Promise<SavedConfiguration | null> {
    const { docs } = await this.payload.find({
      ...SYSTEM,
      collection: 'configurations',
      limit: 1,
      where: { code: { equals: code } },
      select: {
        code: true,
        project: true,
        locale: true,
        snapshot: true,
        render: true,
        proposal: true,
      },
      populate: { projects: { slug: true }, documents: { filename: true } },
    })
    const document = docs[0]
    return document === undefined ? null : toSaved(document)
  }

  async attachProposal(id: number, documentId: number): Promise<void> {
    await this.payload.update({
      ...SYSTEM,
      collection: 'configurations',
      id,
      data: { proposal: documentId },
    })
  }
}
