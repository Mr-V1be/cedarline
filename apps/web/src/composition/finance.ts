import type { Payload } from 'payload'

import { env } from '@/config/env'
import type { KeyRateDeps } from '@/modules/finance/application/key-rate-service'
import { CbrKeyRateSource } from '@/modules/finance/infrastructure/cbr-key-rate-source'
import { PayloadFinancingRepository } from '@/modules/finance/infrastructure/payload-financing-repository'
import { PayloadKeyRateCache } from '@/modules/finance/infrastructure/payload-key-rate-cache'

/** The site asks the Bank of Russia again once its reading is this old. */
const KEY_RATE_MAX_AGE_MS = 6 * 60 * 60 * 1000

/** Financing terms and the key rate; built from a Payload instance, so jobs use it too. */
export function financeServices(payload: Payload) {
  const keyRate: KeyRateDeps = {
    source: new CbrKeyRateSource(env.CBR_DAILY_INFO_URL),
    cache: new PayloadKeyRateCache(payload),
    clock: () => new Date(),
    maxAgeMs: KEY_RATE_MAX_AGE_MS,
    onSourceError: (error) => {
      payload.logger.warn({ err: error }, 'Key rate source is unavailable, using the cached rate')
    },
  }
  return { terms: new PayloadFinancingRepository(payload), keyRate }
}
