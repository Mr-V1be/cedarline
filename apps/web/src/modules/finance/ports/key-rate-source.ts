import type { KeyRate } from '../domain/key-rate'

/** Where the key rate comes from: the Bank of Russia or a stand-in. Throws when unavailable. */
export interface KeyRateSource {
  readonly name: string
  fetch(): Promise<KeyRate>
}
