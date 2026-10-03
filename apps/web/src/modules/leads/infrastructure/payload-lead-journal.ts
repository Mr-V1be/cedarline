import type { Payload } from 'payload'

import type { DeliveryOutcome, LeadReceipt } from '../domain/lead-record'
import type { LeadJournal } from '../ports/lead-journal'

const SYSTEM = { overrideAccess: true, depth: 0 } as const

/** The delivery log of a CMS lead: what reached the CRM and the mail, and what did not. */
export class PayloadLeadJournal implements LeadJournal {
  constructor(
    private readonly payload: Payload,
    private readonly adminUrl: (id: number) => string,
  ) {}

  private async deliveries(reference: string) {
    const lead = await this.payload.findByID({
      ...SYSTEM,
      collection: 'leads',
      id: Number(reference),
      select: { deliveries: true },
    })
    return lead.deliveries ?? []
  }

  async record(reference: string, outcomes: readonly DeliveryOutcome[]): Promise<void> {
    if (outcomes.length === 0) return
    await this.payload.update({
      ...SYSTEM,
      collection: 'leads',
      id: Number(reference),
      data: {
        deliveries: [
          ...(await this.deliveries(reference)),
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

  async delivered(reference: string): Promise<readonly LeadReceipt[]> {
    const rows = await this.deliveries(reference)
    return [
      { channel: 'cms', reference, url: this.adminUrl(Number(reference)) },
      ...rows.flatMap((row) =>
        row.status === 'delivered' && typeof row.reference === 'string' && row.reference !== ''
          ? [{ channel: row.channel, reference: row.reference }]
          : [],
      ),
    ]
  }
}
