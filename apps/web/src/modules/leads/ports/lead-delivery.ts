import type { Lead, LeadReceipt } from '../domain/lead-record'

/** What a channel leaves behind when the lead gets through. */
export interface DeliveryReceipt {
  /** The lead's number in the other system, e.g. the CRM. */
  readonly reference?: string
  /** Key of a copy the recipient can open, when the channel keeps one (the demo mailbox). */
  readonly viewKey?: string
}

/**
 * One way a stored lead travels on: an external CRM, an email to the customer or to sales.
 * Throws when the lead does not get through; the caller logs it and retries later.
 */
export interface LeadDelivery {
  readonly channel: string
  /** Whose copy this is: the customer's letter is the one they are offered to open. */
  readonly audience: 'customer' | 'staff'
  /** `delivered` are the receipts of channels that already got the lead (CRM numbers). */
  deliver(lead: Lead, delivered: readonly LeadReceipt[]): Promise<DeliveryReceipt>
}
