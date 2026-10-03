/** Company details shown across the site. */
export interface SiteContent {
  readonly phone: string
  readonly email: string
  readonly address: string
  readonly hours: string
  readonly region: string
  /** [longitude, latitude] of the factory, when it is set. */
  readonly location: readonly [number, number] | null
  readonly legal: LegalDetails
}

/** Who the operator is, for the contacts page and the personal data policy. */
export interface LegalDetails {
  readonly name: string
  /** The details are made up (a demo stand); the site labels them as such. */
  readonly demo: boolean
  readonly taxId: string
  readonly registrationNumber: string
  readonly privacyEmail: string
  /** Date of the current personal data policy version. */
  readonly privacyEdition: Date
}
