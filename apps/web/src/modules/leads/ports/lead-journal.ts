import type { DeliveryOutcome, LeadReceipt } from '../domain/lead-record'

/** The delivery log next to the lead in the system of record. */
export interface LeadJournal {
  record(reference: string, outcomes: readonly DeliveryOutcome[]): Promise<void>
  /** Channels that got the lead so far, with their references, e.g. the CRM number. */
  delivered(reference: string): Promise<readonly LeadReceipt[]>
}
