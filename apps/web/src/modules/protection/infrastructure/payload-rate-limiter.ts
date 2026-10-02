import { createHmac } from 'node:crypto'

import type { Payload, Where } from 'payload'

import { RATE_LIMITS, type RateLimitBucket } from '../domain/rate-limits'
import type { RateLimiter } from '../ports/rate-limiter'

const SYSTEM = { overrideAccess: true, depth: 0 } as const

/**
 * Sliding-window limiter on a database table, so the limit holds across server instances
 * and restarts. Client addresses are stored only as a keyed hash.
 */
export class PayloadRateLimiter implements RateLimiter {
  constructor(
    private readonly payload: Payload,
    private readonly secret: string,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async consume(bucket: RateLimitBucket, client: string): Promise<boolean> {
    const { limit, windowMs } = RATE_LIMITS[bucket]
    const key = createHmac('sha256', this.secret).update(`rate-limit:${client}`).digest('hex')
    const windowStart = new Date(this.clock().getTime() - windowMs).toISOString()
    const mine: Where[] = [{ bucket: { equals: bucket } }, { key: { equals: key } }]
    const scope: Where = { and: mine }

    await this.payload.delete({
      ...SYSTEM,
      collection: 'rate-limit-hits',
      where: { and: [...mine, { createdAt: { less_than: windowStart } }] },
    })
    const { totalDocs } = await this.payload.count({
      ...SYSTEM,
      collection: 'rate-limit-hits',
      where: scope,
    })
    if (totalDocs >= limit) return false
    await this.payload.create({ ...SYSTEM, collection: 'rate-limit-hits', data: { bucket, key } })
    return true
  }
}
