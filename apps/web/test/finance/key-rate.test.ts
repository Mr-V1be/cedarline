import { describe, expect, it } from 'vitest'

import { currentKeyRate, type KeyRateDeps } from '@/modules/finance/application/key-rate-service'
import type { CachedKeyRate } from '@/modules/finance/ports/key-rate-cache'
import { CbrKeyRateSource } from '@/modules/finance/infrastructure/cbr-key-rate-source'

const HOUR = 3_600_000
const now = new Date('2026-10-03T09:00:00Z')

function deps(source: KeyRateDeps['source'], cached: CachedKeyRate | null) {
  const store = { entry: cached }
  const errors: unknown[] = []
  const value: KeyRateDeps = {
    source,
    cache: {
      read: () => Promise.resolve(store.entry),
      write: (entry) => {
        store.entry = entry
        return Promise.resolve()
      },
    },
    clock: () => now,
    maxAgeMs: 6 * HOUR,
    onSourceError: (error) => errors.push(error),
  }
  return { value, store, errors }
}

const answering = (rate: number) => ({
  name: 'test',
  fetch: () => Promise.resolve({ rate, effectiveFrom: new Date('2026-07-27') }),
})
const failing = { name: 'test', fetch: () => Promise.reject(new Error('timeout')) }
const cachedAt = (hoursAgo: number): CachedKeyRate => ({
  keyRate: { rate: 1600, effectiveFrom: new Date('2026-04-25') },
  fetchedAt: new Date(now.getTime() - hoursAgo * HOUR),
  source: 'test',
})

describe('key rate', () => {
  it('serves a fresh cached reading without asking the source', async () => {
    const { value } = deps(failing, cachedAt(1))
    expect(await currentKeyRate(value)).toMatchObject({ stale: false, keyRate: { rate: 1600 } })
  })

  it('refreshes an old reading and stores the new rate', async () => {
    const { value, store } = deps(answering(1400), cachedAt(8))
    expect(await currentKeyRate(value)).toMatchObject({ stale: false, keyRate: { rate: 1400 } })
    expect(store.entry?.keyRate.rate).toBe(1400)
  })

  it('falls back to the last known rate, marked stale, when the source is down', async () => {
    const { value, errors } = deps(failing, cachedAt(30))
    expect(await currentKeyRate(value)).toMatchObject({ stale: true, keyRate: { rate: 1600 } })
    expect(errors).toHaveLength(1)
  })

  it('has nothing to show if the source never answered', async () => {
    const { value } = deps(failing, null)
    expect(await currentKeyRate(value)).toBeNull()
  })
})

describe('CBR key rate source', () => {
  it('reads the latest rate and the day the current run of it began', async () => {
    const records = [
      ['2026-10-02', '14.00'],
      ['2026-07-28', '14.00'],
      ['2026-07-27', '14.00'],
      ['2026-07-24', '16.00'],
    ]
    const xml =
      '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>' +
      '<KeyRateXMLResponse xmlns="http://web.cbr.ru/"><KeyRateXMLResult><KeyRate xmlns="">' +
      records
        .map(([day, rate]) => `<KR><DT>${day}T00:00:00+03:00</DT><Rate>${rate}</Rate></KR>`)
        .join('') +
      '</KeyRate></KeyRateXMLResult></KeyRateXMLResponse></soap:Body></soap:Envelope>'
    const original = globalThis.fetch
    globalThis.fetch = () => Promise.resolve(new Response(xml, { status: 200 }))
    try {
      const rate = await new CbrKeyRateSource('https://cbr.test/DailyInfo.asmx', () => now).fetch()
      expect(rate.rate).toBe(1400)
      expect(rate.effectiveFrom.toISOString()).toBe('2026-07-26T21:00:00.000Z')
    } finally {
      globalThis.fetch = original
    }
  })
})
