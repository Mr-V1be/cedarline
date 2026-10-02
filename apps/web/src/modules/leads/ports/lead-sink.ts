import type { Lead, LeadReceipt } from '../domain/lead-record'

/**
 * Where leads go: the CMS, an external CRM. Configured as an ordered list; the first sink is
 * the system of record and must accept the lead, the rest are best effort and logged.
 */
export interface LeadSink {
  readonly channel: string
  submit(lead: Lead): Promise<LeadReceipt>
}
