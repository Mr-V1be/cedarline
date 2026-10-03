import type { Payload } from 'payload'

import { basisPointsToPercent, percentToBasisPoints } from '../domain/key-rate'
import type { CachedKeyRate, KeyRateCache } from '../ports/key-rate-cache'

const SYSTEM = { overrideAccess: true, depth: 0 } as const

/** The last key rate in a CMS global: shared by every instance, survives restarts. */
export class PayloadKeyRateCache implements KeyRateCache {
  constructor(private readonly payload: Payload) {}

  async read(): Promise<CachedKeyRate | null> {
    const stored = await this.payload.findGlobal({ ...SYSTEM, slug: 'key-rate' })
    if (
      stored.rate === null ||
      stored.rate === undefined ||
      !stored.effectiveFrom ||
      !stored.fetchedAt
    ) {
      return null
    }
    return {
      keyRate: {
        rate: percentToBasisPoints(stored.rate),
        effectiveFrom: new Date(stored.effectiveFrom),
      },
      fetchedAt: new Date(stored.fetchedAt),
      source: stored.source ?? '',
    }
  }

  async write(entry: CachedKeyRate): Promise<void> {
    await this.payload.updateGlobal({
      ...SYSTEM,
      slug: 'key-rate',
      data: {
        rate: basisPointsToPercent(entry.keyRate.rate),
        effectiveFrom: entry.keyRate.effectiveFrom.toISOString(),
        fetchedAt: entry.fetchedAt.toISOString(),
        source: entry.source,
      },
    })
  }
}
