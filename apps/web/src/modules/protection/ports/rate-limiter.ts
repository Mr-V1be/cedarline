import type { RateLimitBucket } from '../domain/rate-limits'

/** Counts requests per client and bucket; `consume` answers whether this one may proceed. */
export interface RateLimiter {
  consume(bucket: RateLimitBucket, client: string): Promise<boolean>
}
