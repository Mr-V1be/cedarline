/** Lifecycle of a lead in the sales team's hands. */
export const LEAD_STATUSES = ['new', 'in-progress', 'won', 'lost'] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

/** Contact details as the customer typed them, validated and normalised. */
export interface LeadContact {
  readonly name: string
  /** E.164: +79991234567. */
  readonly phone: string
  readonly email: string
  readonly comment: string
}

export const LEAD_FIELDS = ['name', 'phone', 'email', 'comment', 'consent'] as const
export type LeadField = (typeof LEAD_FIELDS)[number]

export type LeadFieldError = 'required' | 'tooLong' | 'invalid'

export type LeadFormResult =
  | { readonly ok: true; readonly contact: LeadContact }
  | { readonly ok: false; readonly errors: Partial<Record<LeadField, LeadFieldError>> }

const LIMITS = { name: 80, email: 120, comment: 1000 } as const
const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/
const DIGITS = /\d/g

/**
 * Russian numbers are accepted in any common spelling (8 999…, +7 (999)…, 999…); others need
 * the international prefix. The result is E.164 or null.
 */
export function normalisePhone(raw: string): string | null {
  const digits = (raw.match(DIGITS) ?? []).join('')
  const international = raw.trim().startsWith('+')
  if (
    !international &&
    digits.length === 11 &&
    (digits.startsWith('8') || digits.startsWith('7'))
  ) {
    return `+7${digits.slice(1)}`
  }
  if (!international && digits.length === 10 && digits.startsWith('9')) return `+7${digits}`
  if (international && digits.length >= 10 && digits.length <= 15) return `+${digits}`
  return null
}

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

/**
 * The one validation of the lead form: the browser runs it for inline hints, the server runs
 * it again on whatever arrives.
 */
export function validateLeadForm(input: Readonly<Record<string, unknown>>): LeadFormResult {
  const name = text(input.name)
  const phoneRaw = text(input.phone)
  const email = text(input.email).toLowerCase()
  const comment = text(input.comment)
  const phone = normalisePhone(phoneRaw)
  const errors: Partial<Record<LeadField, LeadFieldError>> = {}

  if (name === '') errors.name = 'required'
  else if (name.length > LIMITS.name) errors.name = 'tooLong'
  if (phoneRaw === '') errors.phone = 'required'
  else if (phone === null) errors.phone = 'invalid'
  if (email === '') errors.email = 'required'
  else if (email.length > LIMITS.email || !EMAIL.test(email)) errors.email = 'invalid'
  if (comment.length > LIMITS.comment) errors.comment = 'tooLong'
  if (input.consent !== true && input.consent !== 'on' && input.consent !== 'true') {
    errors.consent = 'required'
  }

  if (Object.keys(errors).length > 0 || phone === null) return { ok: false, errors }
  return { ok: true, contact: { name, phone, email, comment } }
}

export const LEAD_LIMITS = LIMITS
