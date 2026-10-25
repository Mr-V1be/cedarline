import { isShareCode } from '@kedrovnik/configurator'
import { Money } from '@kedrovnik/pricing'

import type { Locale } from '@/i18n/locales'
import { savedPrices } from '@/modules/configurator/application/saved-prices'
import type { SavedConfigurationRepository } from '@/modules/configurator/ports/saved-configuration-repository'
import type { ExchangeRateRepository } from '@/modules/pricing/ports/exchange-rate-repository'
import { proposalFor, type ProposalDeps } from '@/modules/proposals/application/proposal-service'

import { validateLeadForm, type LeadField, type LeadFieldError } from '../domain/lead'
import type { DeliveryOutcome, Lead, LeadReceipt } from '../domain/lead-record'
import type { DeliveryQueue } from '../ports/delivery-queue'
import type { LeadDelivery } from '../ports/lead-delivery'
import type { LeadJournal } from '../ports/lead-journal'
import type { LeadSink } from '../ports/lead-sink'
import { attemptDelivery } from './deliver'

export interface SubmitLeadDeps {
  readonly saved: SavedConfigurationRepository
  /** Today's rates, for configurations saved before rates were kept with them. */
  readonly exchangeRates: ExchangeRateRepository
  readonly proposals: ProposalDeps
  /** The system of record: it must take the lead, or the customer is asked to try again. */
  readonly primary: LeadSink
  /** Where the lead goes next, in order: other sinks, then the emails. */
  readonly deliveries: readonly LeadDelivery[]
  readonly journal: LeadJournal
  readonly queue: DeliveryQueue
  readonly describe: (lead: DescribeInput) => Promise<string>
  /** Path of the page with the kept copy of the customer's letter (demo mailbox). */
  readonly letterPath: (viewKey: string) => string
  readonly clock: () => Date
}

/** What the summary line of a lead is made of; the wording is the composition's business. */
export interface DescribeInput {
  readonly locale: Locale
  readonly projectTitle: string
  readonly width: number
  readonly depth: number
  readonly completeness: string
}

export interface SubmitLeadRequest {
  readonly form: Readonly<Record<string, unknown>>
  readonly code: string
  readonly locale: Locale
  /** The honeypot field: people never see it, so anything in it came from a bot. */
  readonly trap: string
}

export type SubmitLeadResult =
  | {
      readonly ok: true
      readonly reference: string
      /** Where the customer opens their letter when mail is kept in the demo mailbox. */
      readonly letter: string | null
    }
  | {
      readonly ok: false
      readonly reason: 'invalid'
      readonly errors: Partial<Record<LeadField, LeadFieldError>>
    }
  | { readonly ok: false; readonly reason: 'unknown-configuration' }

/** A bot that filled the honeypot gets a believable answer and nothing is stored or sent. */
const DECOY_REFERENCE = 'received'

/**
 * Takes a lead for a saved configuration: validates the contact, attaches the proposal,
 * stores the lead in the system of record, hands it to the other channels (CRM, emails), logs
 * every delivery next to the lead and queues the failed ones for retries.
 */
export async function submitLead(
  deps: SubmitLeadDeps,
  request: SubmitLeadRequest,
): Promise<SubmitLeadResult> {
  if (request.trap.trim() !== '') return { ok: true, reference: DECOY_REFERENCE, letter: null }
  const form = validateLeadForm(request.form)
  if (!form.ok) return { ok: false, reason: 'invalid', errors: form.errors }

  const saved = isShareCode(request.code) ? await deps.saved.findByCode(request.code) : null
  if (saved === null) return { ok: false, reason: 'unknown-configuration' }
  const proposal = await proposalFor(deps.proposals, saved, saved.locale)
  const names = saved.snapshot.names[request.locale] ?? saved.snapshot.names[saved.locale]
  if (proposal === null || proposal.documentId === null || names === undefined) {
    return { ok: false, reason: 'unknown-configuration' }
  }

  const { snapshot } = saved
  const projectTitle = names.projects[snapshot.configuration.project] ?? saved.projectSlug
  const lead: Lead = {
    contact: form.contact,
    locale: request.locale,
    submittedAt: deps.clock(),
    configurationId: saved.id,
    projectSlug: saved.projectSlug,
    summary: {
      code: saved.code,
      projectTitle,
      description: await deps.describe({
        locale: request.locale,
        projectTitle,
        width: snapshot.configuration.footprint.width,
        depth: snapshot.configuration.footprint.depth,
        completeness:
          names.tariff.completeness[snapshot.estimate.completeness] ??
          snapshot.estimate.completeness,
      }),
      total: Money.toWholeRubles(snapshot.estimate.total),
      prices: await savedPrices(snapshot, request.locale, deps.exchangeRates),
      totalWeeks: snapshot.schedule.totalWeeks,
      link: deps.proposals.linkTo(saved.code, request.locale),
    },
    proposal: { documentId: proposal.documentId, filename: proposal.filename, data: proposal.data },
  }

  // The system of record must take the lead; if it cannot, the customer is told to retry.
  const primary = await deps.primary.submit(lead)
  const receipts: LeadReceipt[] = [primary]
  const outcomes: DeliveryOutcome[] = []
  let letter: string | null = null
  for (const delivery of deps.deliveries) {
    const { outcome, receipt } = await attemptDelivery(delivery, lead, receipts, deps.clock)
    outcomes.push(outcome)
    if (receipt?.reference !== undefined) {
      receipts.push({ channel: delivery.channel, reference: receipt.reference })
    }
    if (delivery.audience === 'customer' && receipt?.viewKey !== undefined) {
      letter = deps.letterPath(receipt.viewKey)
    }
  }
  await deps.journal.record(primary.reference, outcomes)
  for (const outcome of outcomes.filter((item) => item.status === 'failed')) {
    await deps.queue.retry(primary.reference, outcome.channel)
  }
  return { ok: true, reference: primary.reference, letter }
}
