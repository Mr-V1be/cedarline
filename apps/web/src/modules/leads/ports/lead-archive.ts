import type { Lead } from '../domain/lead-record'

/** Rebuilds a stored lead from the system of record, for deliveries retried later. */
export interface LeadArchive {
  load(reference: string): Promise<Lead | null>
}
