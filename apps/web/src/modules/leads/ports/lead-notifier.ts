import type { DeliveryOutcome, Lead, LeadReceipt } from '../domain/lead-record'

/** Tells the customer and the sales team about a new lead. */
export interface LeadNotifier {
  notify(lead: Lead, receipts: readonly LeadReceipt[]): Promise<readonly DeliveryOutcome[]>
}
