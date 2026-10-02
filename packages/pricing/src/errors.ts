/** Stable machine-readable codes; callers map them to messages, logs and HTTP statuses. */
export type PricingErrorCode =
  | 'INVALID_MONEY'
  | 'INVALID_QUANTITY'
  | 'MISSING_QUANTITY'
  | 'DUPLICATE_KEY'
  | 'UNKNOWN_REFERENCE'
  | 'INVALID_NORM'
  | 'DEPENDENCY_CYCLE'
  | 'EMPTY_COMPLETENESS'
  | 'UNKNOWN_COMPLETENESS'

export class PricingError extends Error {
  readonly code: PricingErrorCode
  readonly details: Readonly<Record<string, unknown>>

  constructor(code: PricingErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'PricingError'
    this.code = code
    this.details = details
  }
}
