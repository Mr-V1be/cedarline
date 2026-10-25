import type { Payload } from 'payload'

import { isLocale } from '@/i18n/locales'
import type { DocumentStore } from '@/modules/configurator/ports/document-store'
import type { SavedConfigurationRepository } from '@/modules/configurator/ports/saved-configuration-repository'
import { restoreDisplayCurrency } from '@/modules/pricing/domain/exchange-rate'
import { Money } from '@kedrovnik/pricing'

import type { Lead } from '../domain/lead-record'
import type { LeadArchive } from '../ports/lead-archive'

const SYSTEM = { overrideAccess: true } as const

const relationOf = <T extends object>(value: number | T | null | undefined): T | null =>
  value === null || value === undefined || typeof value === 'number' ? null : value

/**
 * A lead as it was sent, rebuilt from the CMS lead, its saved configuration and its proposal
 * file: the same single truth the sales team sees, so a retry delivers exactly that.
 */
export class PayloadLeadArchive implements LeadArchive {
  constructor(
    private readonly payload: Payload,
    private readonly saved: SavedConfigurationRepository,
    private readonly documents: DocumentStore,
    private readonly linkTo: (code: string, locale: Lead['locale']) => string,
  ) {}

  async load(reference: string): Promise<Lead | null> {
    const stored = await this.payload
      .findByID({ ...SYSTEM, collection: 'leads', id: Number(reference), depth: 1 })
      .catch(() => null)
    if (stored === null) return null
    const configuration = relationOf(stored.configuration)
    const proposalId =
      typeof stored.proposal === 'number' ? stored.proposal : (stored.proposal?.id ?? null)
    const locale =
      stored.locale !== null && stored.locale !== undefined && isLocale(stored.locale)
        ? stored.locale
        : null
    const prices = restoreDisplayCurrency(stored.display)
    if (configuration === null || proposalId === null || locale === null || prices === null) {
      return null
    }
    const [saved, proposal] = await Promise.all([
      this.saved.findByCode(configuration.code),
      this.documents.read(proposalId),
    ])
    if (saved === null || proposal === null) return null
    const names = saved.snapshot.names[locale] ?? saved.snapshot.names[saved.locale]
    return {
      contact: {
        name: stored.name,
        phone: stored.phone,
        email: stored.email,
        comment: stored.comment ?? '',
      },
      locale,
      submittedAt: new Date(stored.consentAt ?? stored.createdAt),
      configurationId: configuration.id,
      projectSlug: saved.projectSlug,
      summary: {
        code: saved.code,
        projectTitle: names?.projects[saved.snapshot.configuration.project] ?? saved.projectSlug,
        description: stored.summary ?? '',
        total: stored.total ?? Money.toWholeRubles(saved.snapshot.estimate.total),
        prices,
        totalWeeks: saved.snapshot.schedule.totalWeeks,
        link: stored.link ?? this.linkTo(saved.code, locale),
      },
      proposal: {
        documentId: proposal.document.id,
        filename: proposal.document.filename,
        data: proposal.data,
      },
    }
  }
}
