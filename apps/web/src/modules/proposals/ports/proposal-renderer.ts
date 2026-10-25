import type { Locale } from '@/i18n/locales'
import type { ConfiguratorNames } from '@/modules/configurator/domain/names'
import type { ConfigurationSnapshot } from '@/modules/configurator/domain/snapshot'
import type { DisplayCurrency } from '@/modules/pricing/domain/exchange-rate'
import type { SiteContent } from '@/modules/site/domain/site'

/** Everything a commercial proposal shows; the renderer decides how it looks. */
export interface ProposalInput {
  readonly code: string
  readonly locale: Locale
  readonly snapshot: ConfigurationSnapshot
  readonly names: ConfiguratorNames
  /** The currency the figures are written in, at the rates the configuration was saved with. */
  readonly prices: DisplayCurrency
  readonly company: SiteContent
  /** Public link to the saved configuration, also encoded in the QR code. */
  readonly link: string
  /** The scene as the customer saw it (JPEG), or null when none was captured. */
  readonly render: Buffer | null
}

export interface ProposalRenderer {
  render(input: ProposalInput): Promise<Buffer>
}
