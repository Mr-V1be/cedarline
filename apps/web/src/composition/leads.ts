import 'server-only'

import type { Payload } from 'payload'

import type { DocumentStore } from '@/modules/configurator/ports/document-store'
import type { SavedConfigurationRepository } from '@/modules/configurator/ports/saved-configuration-repository'
import type { SubmitLeadDeps } from '@/modules/leads/application/submit-lead'
import { describeLead } from '@/modules/leads/infrastructure/lead-description'
import { PayloadRateLimiter } from '@/modules/protection/infrastructure/payload-rate-limiter'
import type { ProposalDeps } from '@/modules/proposals/application/proposal-service'
import { ReactPdfProposalRenderer } from '@/modules/proposals/infrastructure/react-pdf-proposal-renderer'
import type { SiteRepository } from '@/modules/site/ports/site-repository'

import { env } from '@/config/env'

import { configurationLink, deliveryServices, letterPath } from './deliveries'

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
    linkTo: configurationLink,
  }
  const delivery = deliveryServices(payload)
  const leads: SubmitLeadDeps = {
    saved,
    proposals,
    primary: delivery.primary,
    deliveries: delivery.deliveries,
    journal: delivery.journal,
    queue: delivery.queue,
    describe: describeLead,
    letterPath,
    clock: () => new Date(),
  }
  return {
    proposals,
    leads,
    mailbox: delivery.mailbox,
    rateLimiter: new PayloadRateLimiter(payload, env.PAYLOAD_SECRET),
    linkTo: configurationLink,
  }
}
