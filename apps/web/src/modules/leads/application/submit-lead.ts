import { isShareCode } from '@kedrovnik/configurator'
import { Money } from '@kedrovnik/pricing'

import type { Locale } from '@/i18n/locales'
import type { SavedConfigurationRepository } from '@/modules/configurator/ports/saved-configuration-repository'
import { proposalFor, type ProposalDeps } from '@/modules/proposals/application/proposal-service'

import { validateLeadForm, type LeadField, type LeadFieldError } from '../domain/lead'
import type { DeliveryOutcome, Lead, LeadReceipt } from '../domain/lead-record'
import type { LeadJournal } from '../ports/lead-journal'
import type { LeadNotifier } from '../ports/lead-notifier'
import type { LeadSink } from '../ports/lead-sink'

export interface SubmitLeadDeps {
  readonly saved: SavedConfigurationRepository
  readonly proposals: ProposalDeps
  /** Ordered: the first sink is the system of record. */
  readonly sinks: readonly [LeadSink, ...LeadSink[]]
  readonly notifier: LeadNotifier
  readonly journal: LeadJournal
  readonly describe: (lead: DescribeInput) => Promise<string>
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
  | { readonly ok: true; readonly reference: string }
  | {
      readonly ok: false
      readonly reason: 'invalid'
      readonly errors: Partial<Record<LeadField, LeadFieldError>>
    }
  | { readonly ok: false; readonly reason: 'unknown-configuration' }

/** A bot that filled the honeypot gets a believable answer and nothing is stored or sent. */
const DECOY_REFERENCE = 'received'

async function attempt(channel: string, at: () => Date, action: () => Promise<LeadReceipt>) {
  try {
    const receipt = await action()
    const outcome: DeliveryOutcome = {
      channel,
      status: 'delivered',
      reference: receipt.reference,
      at: at(),
    }
    return { receipt, outcome }
  } catch (error) {
    const outcome: DeliveryOutcome = {
      channel,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      at: at(),
    }
    return { receipt: null, outcome }
  }
}

/**
 * Takes a lead for a saved configuration: validates the contact, attaches the proposal,
 * stores the lead in the system of record, hands it to the other sinks, emails the customer
 * and the sales team, and logs every delivery next to the lead.
 */
export async function submitLead(
  deps: SubmitLeadDeps,
  request: SubmitLeadRequest,
): Promise<SubmitLeadResult> {
  if (request.trap.trim() !== '') return { ok: true, reference: DECOY_REFERENCE }
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
      totalWeeks: snapshot.schedule.totalWeeks,
      link: deps.proposals.linkTo(saved.code, request.locale),
    },
    proposal: { documentId: proposal.documentId, filename: proposal.filename, data: proposal.data },
  }

  // The system of record must take the lead; if it cannot, the customer is told to retry.
  const [primarySink, ...secondarySinks] = deps.sinks
  const primary = await primarySink.submit(lead)
  const outcomes: DeliveryOutcome[] = []
  const receipts: LeadReceipt[] = [primary]
  for (const sink of secondarySinks) {
    const { receipt, outcome } = await attempt(sink.channel, deps.clock, () => sink.submit(lead))
    outcomes.push(outcome)
    if (receipt !== null) receipts.push(receipt)
  }
  outcomes.push(...(await deps.notifier.notify(lead, receipts)))
  await deps.journal.record(primary, outcomes)
  return { ok: true, reference: primary.reference }
}
