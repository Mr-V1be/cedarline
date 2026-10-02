export type ConfiguratorErrorCode =
  | 'INVALID_CONFIGURATION'
  | 'UNKNOWN_PROJECT'
  | 'UNKNOWN_CHOICE'
  | 'RESTRICTED_CHOICE'
  | 'INVALID_OFFER'

/** Raised when a configuration, a choice or the offered option data is not usable. */
export class ConfiguratorError extends Error {
  readonly code: ConfiguratorErrorCode
  readonly details: Readonly<Record<string, unknown>>

  constructor(code: ConfiguratorErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ConfiguratorError'
    this.code = code
    this.details = details
  }
}
