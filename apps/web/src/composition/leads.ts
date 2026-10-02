import 'server-only'

import type { Payload } from 'payload'

import { env, type LeadSinkKey } from '@/config/env'
import type { Locale } from '@/i18n/locales'
import type { DocumentStore } from '@/modules/configurator/ports/document-store'
import type { SavedConfigurationRepository } from '@/modules/configurator/ports/saved-configuration-repository'
import type { SubmitLeadDeps } from '@/modules/leads/application/submit-lead'
import { Bitrix24LeadSink } from '@/modules/leads/infrastructure/bitrix24-lead-sink'
import { CmsLeadSink } from '@/modules/leads/infrastructure/cms-lead-sink'
import { describeLead } from '@/modules/leads/infrastructure/lead-description'
import { PayloadLeadJournal } from '@/modules/leads/infrastructure/payload-lead-journal'
import { PayloadLeadNotifier } from '@/modules/leads/infrastructure/payload-lead-notifier'
import type { LeadSink } from '@/modules/leads/ports/lead-sink'
import { PayloadRateLimiter } from '@/modules/protection/infrastructure/payload-rate-limiter'
import type { ProposalDeps } from '@/modules/proposals/application/proposal-service'
import { ReactPdfProposalRenderer } from '@/modules/proposals/infrastructure/react-pdf-proposal-renderer'
import type { SiteRepository } from '@/modules/site/ports/site-repository'

const linkTo = (code: string, locale: Locale) =>
  `${env.SITE_URL}${locale === 'ru' ? '' : `/${locale}`}/c/${code}`

/** The configured lead sinks, in order; `LEAD_SINKS` picks them, the first is primary. */
function sinksOf(payload: Payload): SubmitLeadDeps['sinks'] {
  const make = (key: LeadSinkKey): LeadSink => {
    switch (key) {
      case 'cms':
        return new CmsLeadSink(payload, (id) => `${env.SITE_URL}/admin/collections/leads/${id}`)
      case 'bitrix24':
        return new Bitrix24LeadSink(env.BITRIX24_WEBHOOK_URL)
    }
  }
  const [first, ...rest] = env.LEAD_SINKS
  if (first === undefined) throw new Error('LEAD_SINKS must name at least one sink')
  return [make(first), ...rest.map(make)]
}

/** Proposals, leads and the rate limiter: everything behind the configurator's actions. */
export function leadServices({
  payload,
  saved,
  documents,
  site,
}: {
  readonly payload: Payload
  readonly saved: SavedConfigurationRepository
  readonly documents: DocumentStore
  readonly site: SiteRepository
}) {
  const proposals: ProposalDeps = {
    saved,
    documents,
    renderer: new ReactPdfProposalRenderer(),
    site,
    linkTo,
  }
  const leads: SubmitLeadDeps = {
    saved,
    proposals,
    sinks: sinksOf(payload),
    notifier: new PayloadLeadNotifier(payload),
    journal: new PayloadLeadJournal(payload),
    describe: describeLead,
    clock: () => new Date(),
  }
  return {
    proposals,
    leads,
    rateLimiter: new PayloadRateLimiter(payload, env.PAYLOAD_SECRET),
    linkTo,
  }
}
