import type { DeliveryOutcome, Lead, LeadReceipt } from '../domain/lead-record'
import type { DeliveryReceipt, LeadDelivery } from '../ports/lead-delivery'

export interface Attempt {
  readonly outcome: DeliveryOutcome
  readonly receipt: DeliveryReceipt | null
}

/** Tries one channel and turns the result, success or error, into a log entry. */
export async function attemptDelivery(
  delivery: LeadDelivery,
  lead: Lead,
  delivered: readonly LeadReceipt[],
  clock: () => Date,
): Promise<Attempt> {
  try {
    const receipt = await delivery.deliver(lead, delivered)
    return {
      outcome: {
        channel: delivery.channel,
        status: 'delivered',
        ...(receipt.reference === undefined ? {} : { reference: receipt.reference }),
        at: clock(),
      },
      receipt,
    }
  } catch (error) {
    return {
      outcome: {
        channel: delivery.channel,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        at: clock(),
      },
      receipt: null,
    }
  }
}
