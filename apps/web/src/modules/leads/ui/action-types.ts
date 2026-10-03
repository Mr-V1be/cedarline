import type { LeadField, LeadFieldError } from '../domain/lead'

export type LeadActionResult =
  | {
      readonly ok: true
      readonly reference: string
      /** The customer's letter in the demo mailbox, when mail is kept there. */
      readonly letter: string | null
    }
  | {
      readonly ok: false
      readonly reason: 'invalid'
      readonly errors: Partial<Record<LeadField, LeadFieldError>>
    }
  | { readonly ok: false; readonly reason: 'limited' | 'unknown-configuration' | 'failed' }

export type LeadAction = (form: FormData) => Promise<LeadActionResult>
