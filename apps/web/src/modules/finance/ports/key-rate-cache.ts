import type { KeyRate } from '../domain/key-rate'

export interface CachedKeyRate {
  readonly keyRate: KeyRate
  readonly fetchedAt: Date
  readonly source: string
}

/** The last key rate read from the source, kept so the site works when the source does not. */
export interface KeyRateCache {
  read(): Promise<CachedKeyRate | null>
  write(entry: CachedKeyRate): Promise<void>
}
