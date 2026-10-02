export type HouseErrorCode =
  | 'INVALID_DIMENSION'
  | 'UNKNOWN_OPTION'
  | 'UNKNOWN_LEVEL'
  | 'ROOM_OUT_OF_BOUNDS'
  | 'ROOMS_OVERLAP'
  | 'OPENING_OUT_OF_WALL'
  | 'OPENINGS_OVERLAP'
  | 'TERRACE_OUT_OF_WALL'
  | 'DUPLICATE_ID'

/** Raised when a design or configuration violates a geometric invariant. */
export class HouseError extends Error {
  readonly code: HouseErrorCode
  readonly details: Readonly<Record<string, unknown>>

  constructor(code: HouseErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'HouseError'
    this.code = code
    this.details = details
  }
}
