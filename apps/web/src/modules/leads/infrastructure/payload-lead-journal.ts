import type { Payload } from 'payload'

import type { DeliveryOutcome, LeadReceipt } from '../domain/lead-record'
import type { LeadJournal } from '../ports/lead-journal'

const SYSTEM = { overrideAccess: true, depth: 0 } as const

/** Appends delivery outcomes to the CMS lead, so staff see what reached the CRM and mail. */
export class PayloadLeadJournal implements LeadJournal {
  constructor(private readonly payload: Payload) {}

  async record(primary: LeadReceipt, outcomes: readonly DeliveryOutcome[]): Promise<void> {
    if (primary.channel !== 'cms' || outcomes.length === 0) return
    const id = Number(primary.reference)
    const lead = await this.payload.findByID({
      ...SYSTEM,
      collection: 'leads',
      id,
      select: { deliveries: true },
    })
    await this.payload.update({
      ...SYSTEM,
      collection: 'leads',
      id,
      data: {
        deliveries: [
          ...(lead.deliveries ?? []),
          ...outcomes.map((outcome) => ({
            channel: outcome.channel,
            status: outcome.status,
            reference: outcome.reference ?? null,
            error: outcome.error?.slice(0, 500) ?? null,
            at: outcome.at.toISOString(),
          })),
        ],
      },
    })
  }
}
