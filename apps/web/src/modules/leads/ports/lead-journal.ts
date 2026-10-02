import type { DeliveryOutcome, LeadReceipt } from '../domain/lead-record'

/** Keeps the delivery log next to the lead in the system of record. */
export interface LeadJournal {
  record(primary: LeadReceipt, outcomes: readonly DeliveryOutcome[]): Promise<void>
}
