import type { KeyRateReading } from '../domain/key-rate'
import type { KeyRateCache } from '../ports/key-rate-cache'
import type { KeyRateSource } from '../ports/key-rate-source'

export interface KeyRateDeps {
  readonly source: KeyRateSource
  readonly cache: KeyRateCache
  readonly clock: () => Date
  /**
   * How long a reading is used before the source is asked again. The Bank of Russia sets the
   * rate at board meetings and publishes it ahead, so a few hours never miss a change.
   */
  readonly maxAgeMs: number
  readonly onSourceError: (error: unknown) => void
}

/**
 * The current key rate: the cached reading while it is fresh, otherwise the source. When the
 * source fails, the last known rate is returned marked as stale; null only if it never answered.
 */
export async function currentKeyRate(deps: KeyRateDeps): Promise<KeyRateReading | null> {
  const cached = await deps.cache.read()
  const now = deps.clock()
  if (cached !== null && now.getTime() - cached.fetchedAt.getTime() < deps.maxAgeMs) {
    return { keyRate: cached.keyRate, fetchedAt: cached.fetchedAt, stale: false }
  }
  return refreshKeyRate(deps, cached)
}

/** Asks the source now (scheduled refresh, or a stale cache), keeping the cache on failure. */
export async function refreshKeyRate(
  deps: KeyRateDeps,
  cached?: Awaited<ReturnType<KeyRateCache['read']>>,
): Promise<KeyRateReading | null> {
  const previous = cached === undefined ? await deps.cache.read() : cached
  try {
    const keyRate = await deps.source.fetch()
    const fetchedAt = deps.clock()
    await deps.cache.write({ keyRate, fetchedAt, source: deps.source.name })
    return { keyRate, fetchedAt, stale: false }
  } catch (error) {
    deps.onSourceError(error)
    return previous === null
      ? null
      : { keyRate: previous.keyRate, fetchedAt: previous.fetchedAt, stale: true }
  }
}
