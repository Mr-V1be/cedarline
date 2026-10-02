import type { TariffGrid } from '@kedrovnik/pricing'

/** Localised names of the keys used in the grid, for estimates and schedules on screen. */
export interface TariffNames {
  readonly sections: Readonly<Record<string, string>>
  readonly completeness: Readonly<Record<string, string>>
  readonly phases: Readonly<Record<string, string>>
  readonly stages: Readonly<Record<string, string>>
  readonly rates: Readonly<Record<string, string>>
}

export interface Tariff {
  readonly grid: TariffGrid
  readonly names: TariffNames
}

export interface TariffRepository {
  load(): Promise<Tariff>
}
