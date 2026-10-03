import type { DeliveryOutcome } from '../domain/lead-record'
import type { LeadArchive } from '../ports/lead-archive'
import type { LeadDelivery } from '../ports/lead-delivery'
import type { LeadJournal } from '../ports/lead-journal'
import { attemptDelivery } from './deliver'

export interface RetryDeliveryDeps {
  readonly archive: LeadArchive
  readonly deliveries: readonly LeadDelivery[]
  readonly journal: LeadJournal
  readonly clock: () => Date
}

export class UnknownDeliveryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnknownDeliveryError'
  }
}

/**
 * Delivers a stored lead to one channel again — from the retry queue or by a manager from the
 * lead card — and logs the outcome next to the lead.
 */
export async function retryDelivery(
  deps: RetryDeliveryDeps,
  reference: string,
  channel: string,
): Promise<DeliveryOutcome> {
  const delivery = deps.deliveries.find((candidate) => candidate.channel === channel)
  if (delivery === undefined) throw new UnknownDeliveryError(`No delivery channel ${channel}`)
  const lead = await deps.archive.load(reference)
  if (lead === null) throw new UnknownDeliveryError(`No lead ${reference}`)
  const delivered = await deps.journal.delivered(reference)
  const { outcome } = await attemptDelivery(delivery, lead, delivered, deps.clock)
  await deps.journal.record(reference, [outcome])
  return outcome
}
