export type FinanceErrorCode =
  | 'INVALID_TERMS'
  | 'INVALID_PRICE'
  | 'DOWN_PAYMENT_OUT_OF_RANGE'
  | 'TERM_OUT_OF_RANGE'
  | 'INVALID_KEY_RATE'

/** A financing calculation was asked for something the terms do not allow. */
export class FinanceError extends Error {
  readonly code: FinanceErrorCode

  constructor(code: FinanceErrorCode, message: string) {
    super(message)
    this.name = 'FinanceError'
    this.code = code
  }
}
