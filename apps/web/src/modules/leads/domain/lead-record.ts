import type { Locale } from '@/i18n/locales'
import type { DisplayCurrency } from '@/modules/pricing/domain/exchange-rate'

import type { LeadContact } from './lead'

/** What the configuration in a lead amounts to, in the customer's language. */
export interface LeadConfigurationSummary {
  readonly code: string
  readonly projectTitle: string
  /** One line: «Пихта М · 9 × 6 м · Под ключ». */
  readonly description: string
  /** Whole rubles, exactly as in the saved estimate. */
  readonly total: number
  /** The currency and the rate the customer read the prices in: the total as they saw it. */
  readonly prices: DisplayCurrency
  readonly totalWeeks: number
  readonly link: string
}

export interface LeadAttachment {
  readonly documentId: number
  readonly filename: string
  readonly data: Buffer
}

/** A lead ready for delivery: contact, configuration and the proposal. */
export interface Lead {
  readonly contact: LeadContact
  readonly locale: Locale
  readonly submittedAt: Date
  readonly configurationId: number
  readonly projectSlug: string
  readonly summary: LeadConfigurationSummary
  readonly proposal: LeadAttachment
}

export interface LeadReceipt {
  readonly channel: string
  readonly reference: string
  /** Where staff open the lead, when the channel has a page for it. */
  readonly url?: string
}

export interface DeliveryOutcome {
  readonly channel: string
  readonly status: 'delivered' | 'failed'
  readonly reference?: string
  readonly error?: string
  readonly at: Date
}
