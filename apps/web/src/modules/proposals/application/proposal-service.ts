import type { Locale } from '@/i18n/locales'
import type { SavedConfiguration } from '@/modules/configurator/domain/snapshot'
import type { DocumentStore } from '@/modules/configurator/ports/document-store'
import type { SavedConfigurationRepository } from '@/modules/configurator/ports/saved-configuration-repository'
import type { SiteRepository } from '@/modules/site/ports/site-repository'

import type { ProposalRenderer } from '../ports/proposal-renderer'

export interface ProposalDeps {
  readonly saved: SavedConfigurationRepository
  readonly documents: DocumentStore
  readonly renderer: ProposalRenderer
  readonly site: SiteRepository
  /** Public link of a saved configuration in a language. */
  readonly linkTo: (code: string, locale: Locale) => string
}

export interface ProposalFile {
  readonly filename: string
  readonly data: Buffer
  /** Stored document id; null for a proposal rendered in another language on request. */
  readonly documentId: number | null
}

export const proposalFilename = (code: string, locale: Locale) =>
  locale === 'ru' ? `kedrovnik-kp-${code}.pdf` : `kedrovnik-proposal-${code}-${locale}.pdf`

/**
 * The proposal of a saved configuration. In the language it was saved in, the PDF is made
 * once and kept with the configuration (the lead attaches that very file); in another
 * language it is rendered on request from the same snapshot.
 */
export async function proposalFor(
  deps: ProposalDeps,
  saved: SavedConfiguration,
  locale: Locale,
): Promise<ProposalFile | null> {
  const filename = proposalFilename(saved.code, locale)
  const keep = locale === saved.locale
  if (keep && saved.proposalId !== null) {
    const stored = await deps.documents.read(saved.proposalId)
    if (stored !== null) return { filename, data: stored.data, documentId: stored.document.id }
  }

  const names = saved.snapshot.names[locale] ?? saved.snapshot.names[saved.locale]
  if (names === undefined) return null
  const [company, render] = await Promise.all([
    deps.site.load(locale),
    saved.renderId === null ? null : deps.documents.read(saved.renderId),
  ])
  const data = await deps.renderer.render({
    code: saved.code,
    locale,
    snapshot: saved.snapshot,
    names,
    company,
    link: deps.linkTo(saved.code, locale),
    render: render?.data ?? null,
  })
  if (!keep) return { filename, data, documentId: null }

  const document = await deps.documents.save('proposal', filename, 'application/pdf', data)
  await deps.saved.attachProposal(saved.id, document.id)
  return { filename, data, documentId: document.id }
}
