import type { TariffNames } from '@/modules/pricing/ports/tariff-repository'

/**
 * Display names of the data-defined keys the configurator shows, in one language. Registry
 * values (roof kinds, finishes, window styles) are named by the message catalog instead.
 */
export interface ConfiguratorNames {
  /** Project slug → title. */
  readonly projects: Readonly<Record<string, string>>
  /** Facade colour #rrggbb → name. */
  readonly colours: Readonly<Record<string, string>>
  /** Engineering system key → name. */
  readonly systems: Readonly<Record<string, string>>
  /** Compatibility rule key → explanation for the customer. */
  readonly rules: Readonly<Record<string, string>>
  readonly tariff: TariffNames
}
