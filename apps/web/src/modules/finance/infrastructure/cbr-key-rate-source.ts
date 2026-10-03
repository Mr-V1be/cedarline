import { XMLParser } from 'fast-xml-parser'
import { z } from 'zod'

import { percentToBasisPoints, type KeyRate } from '../domain/key-rate'
import type { KeyRateSource } from '../ports/key-rate-source'

/** How far back the history is read to find the day the current rate took effect. */
const HISTORY_DAYS = 400
const DAY_MS = 86_400_000
const TIMEOUT_MS = 5000
const SOAP_ACTION = 'http://web.cbr.ru/KeyRateXML'

const observation = z.object({ DT: z.string(), Rate: z.coerce.number().nonnegative() })
const response = z.object({
  Envelope: z.object({
    Body: z.object({
      KeyRateXMLResponse: z.object({
        KeyRateXMLResult: z.object({
          KeyRate: z.object({ KR: z.union([observation, z.array(observation)]) }),
        }),
      }),
    }),
  }),
})

const isoDay = (date: Date) => date.toISOString().slice(0, 10)

/**
 * The Bank of Russia key rate from its public DailyInfo web service (SOAP, no key). The service
 * lists the rate for every business day; the current rate took effect on the first day of the
 * latest run of equal values.
 */
export class CbrKeyRateSource implements KeyRateSource {
  readonly name = 'cbr.ru DailyInfo'

  constructor(
    private readonly endpoint: string,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async fetch(): Promise<KeyRate> {
    const to = this.clock()
    const from = new Date(to.getTime() - HISTORY_DAYS * DAY_MS)
    const body =
      '<?xml version="1.0" encoding="utf-8"?>' +
      '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>' +
      `<KeyRateXML xmlns="http://web.cbr.ru/"><fromDate>${isoDay(from)}</fromDate>` +
      `<ToDate>${isoDay(to)}</ToDate></KeyRateXML></soap:Body></soap:Envelope>`
    const reply = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'text/xml; charset=utf-8', soapaction: `"${SOAP_ACTION}"` },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!reply.ok) throw new Error(`Key rate service answered ${reply.status}`)
    const parsed = response.parse(
      new XMLParser({ removeNSPrefix: true, parseTagValue: false }).parse(await reply.text()),
    )
    const records = parsed.Envelope.Body.KeyRateXMLResponse.KeyRateXMLResult.KeyRate.KR
    const history = (Array.isArray(records) ? records : [records])
      .map((record) => ({ day: new Date(record.DT), rate: percentToBasisPoints(record.Rate) }))
      .filter((record) => !Number.isNaN(record.day.getTime()))
      .sort((left, right) => right.day.getTime() - left.day.getTime())
    const [latest] = history
    if (latest === undefined) throw new Error('Key rate service returned no rates')
    const run = history.findIndex((record) => record.rate !== latest.rate)
    const first = run === -1 ? history[history.length - 1] : history[run - 1]
    return { rate: latest.rate, effectiveFrom: (first ?? latest).day }
  }
}
