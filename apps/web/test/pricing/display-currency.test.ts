import { Money } from '@cedarline/pricing'
import type { GlobalBeforeChangeHook } from 'payload'
import { describe, expect, it } from 'vitest'

import { stampRateDates } from '@/cms/hooks/exchange-rate-hooks'
import { LOCALES } from '@/i18n/locales'
import { createPriceFormatter } from '@/modules/pricing/application/price-formatter'
import { toBaseMoney, toDisplayMinor } from '@/modules/pricing/domain/conversion'
import { AMOUNT_KINDS, CURRENCIES, DISPLAY_CURRENCIES } from '@/modules/pricing/domain/currencies'
import {
  BASE_DISPLAY,
  displayCurrencyFor,
  missingDisplayRates,
  restoreDisplayCurrency,
  storeDisplayCurrency,
  validateExchangeRates,
  type DisplayCurrency,
  type ExchangeRate,
} from '@/modules/pricing/domain/exchange-rate'

const RATE: ExchangeRate = { currency: 'USD', rate: 85, setOn: '2026-10-01T09:00:00.000Z' }
const USD: DisplayCurrency = { currency: 'USD', rate: RATE }
const rubles = (amount: number) => Money.ofRubles(amount)

describe('locale → display currency', () => {
  it('maps every language of the site to a currency of the registry', () => {
    for (const locale of LOCALES) expect(CURRENCIES[DISPLAY_CURRENCIES[locale]]).toBeDefined()
  })

  it('shows rubles in Russian and dollars in English', () => {
    expect(displayCurrencyFor('ru', [RATE])).toEqual(BASE_DISPLAY)
    expect(displayCurrencyFor('en', [RATE])).toEqual(USD)
  })

  it('falls back to the tariff currency when the rate is missing', () => {
    expect(displayCurrencyFor('en', [])).toEqual(BASE_DISPLAY)
    expect(missingDisplayRates([])).toEqual(['USD'])
    expect(missingDisplayRates([RATE])).toEqual([])
  })
})

describe('conversion and rounding per kind', () => {
  it('keeps rubles as the Russian site shows them: whole rubles', () => {
    for (const kind of AMOUNT_KINDS) {
      expect(toDisplayMinor(Money.ofKopecks(509_376_137), BASE_DISPLAY, kind)).toBe(509_376_100)
    }
  })

  it('converts exact amounts to whole dollars', () => {
    // 5 117 161 ₽ / 85 = $60,201.89
    expect(toDisplayMinor(rubles(5_117_161), USD, 'exact')).toBe(6_020_200)
  })

  it('rounds a «from» price up to $100, never below the exact figure', () => {
    expect(toDisplayMinor(rubles(5_117_161), USD, 'from')).toBe(6_030_000)
    expect(toDisplayMinor(rubles(5_100_000), USD, 'from')).toBe(6_000_000)
    for (const amount of [1, 84_999, 2_690_732, 9_999_999]) {
      expect(toDisplayMinor(rubles(amount), USD, 'from')).toBeGreaterThanOrEqual(
        toDisplayMinor(rubles(amount), USD, 'exact'),
      )
    }
  })

  it('writes option deltas in whole dollars, symmetric for savings', () => {
    // 1 150 ₽ / 85 = $13.53
    expect(toDisplayMinor(rubles(1_150), USD, 'delta')).toBe(1_400)
    expect(toDisplayMinor(rubles(-1_150), USD, 'delta')).toBe(-1_400)
    expect(toDisplayMinor(rubles(-20), USD, 'delta')).toBe(0)
  })

  it('keeps cents in unit prices, so quantity × rate reads as the line amount', () => {
    // 7 900 ₽ / 85 = $92.941
    expect(toDisplayMinor(rubles(7_900), USD, 'unitPrice')).toBe(9_294)
  })

  it('converts from whole rubles, so a sum stored in rubles converts to what was shown', () => {
    for (const kopecks of [8_549, 8_550, 509_376_137, 123_456_789]) {
      const whole = rubles(Money.toWholeRubles(Money.ofKopecks(kopecks)))
      expect(toDisplayMinor(Money.ofKopecks(kopecks), USD, 'exact')).toBe(
        toDisplayMinor(whole, USD, 'exact'),
      )
    }
  })

  it('uses the rate to four decimals without float drift and stays exact for large sums', () => {
    const precise: DisplayCurrency = { currency: 'USD', rate: { ...RATE, rate: 81.4672 } }
    // 1 000 000 000 ₽ / 81.4672 = $12,274,878.72
    expect(toDisplayMinor(rubles(1_000_000_000), precise, 'exact')).toBe(1_227_487_900)
  })

  it('turns a figure typed in dollars back into tariff money', () => {
    expect(toBaseMoney(6_200_000, USD)).toBe(rubles(5_270_000))
    expect(toBaseMoney(509_376_137, BASE_DISPLAY)).toBe(Money.ofKopecks(509_376_137))
  })

  it('refuses a display currency without its rate', () => {
    expect(() => toDisplayMinor(rubles(1), { currency: 'USD', rate: null }, 'exact')).toThrow()
  })
})

describe('exchange rates', () => {
  it('accepts a positive rate with up to four decimals', () => {
    expect(validateExchangeRates([{ ...RATE, rate: 85.1234 }])).toHaveLength(1)
  })

  it.each([
    ['too precise', [{ ...RATE, rate: 85.12345 }], 'INVALID_RATE'],
    ['zero', [{ ...RATE, rate: 0 }], 'INVALID_RATE'],
    ['undated', [{ ...RATE, setOn: '' }], 'INVALID_RATE'],
    ['given twice', [RATE, RATE], 'DUPLICATE_RATE'],
    ['for the tariff currency', [{ ...RATE, currency: 'RUB' as const }], 'UNKNOWN_CURRENCY'],
  ])('rejects a rate %s', (_, rates, code) => {
    expect(() => validateExchangeRates(rates)).toThrow(expect.objectContaining({ code }))
  })
})

describe('the snapshot a lead keeps', () => {
  it('stores the currency with its rate and restores exactly that', () => {
    expect(storeDisplayCurrency(USD)).toEqual({
      currency: 'USD',
      rate: 85,
      rateSetOn: RATE.setOn,
    })
    expect(restoreDisplayCurrency(storeDisplayCurrency(USD))).toEqual(USD)
    expect(storeDisplayCurrency(BASE_DISPLAY)).toEqual({
      currency: 'RUB',
      rate: null,
      rateSetOn: null,
    })
    expect(restoreDisplayCurrency(storeDisplayCurrency(BASE_DISPLAY))).toEqual(BASE_DISPLAY)
  })

  it('does not make up a rate that was not stored', () => {
    expect(restoreDisplayCurrency({ currency: 'USD', rate: null, rateSetOn: null })).toBeNull()
    expect(restoreDisplayCurrency({ currency: 'XYZ' })).toBeNull()
  })

  it('reads back the total the customer saw from the stored rubles', () => {
    const restored = restoreDisplayCurrency(storeDisplayCurrency(USD))
    if (restored === null) throw new Error('not restored')
    const prices = createPriceFormatter(restored)
    expect(prices.value(rubles(5_117_161), 'exact')).toBe(60_202)
    expect(prices.format(rubles(5_117_161), 'exact')).toBe('$60,202')
  })
})

describe('the date of a rate', () => {
  const stamp = (rates: object[], previous: object[]) =>
    (stampRateDates as (args: object) => { rates: Array<{ rate: number; setOn: string }> })({
      data: { rates },
      originalDoc: { rates: previous },
    } satisfies Partial<Parameters<GlobalBeforeChangeHook>[0]>)

  it('is set by the code when the rate changes', () => {
    const before = Date.now()
    const [row] = stamp([{ currency: 'USD', rate: 90, setOn: RATE.setOn }], [RATE]).rates
    expect(Date.parse(row?.setOn ?? '')).toBeGreaterThanOrEqual(before)
  })

  it('stays when the rate does not change, and an explicit date is kept', () => {
    expect(stamp([{ ...RATE }], [RATE]).rates[0]?.setOn).toBe(RATE.setOn)
    const chosen = '2026-09-15T09:00:00.000Z'
    expect(stamp([{ ...RATE, rate: 84, setOn: chosen }], [RATE]).rates[0]?.setOn).toBe(chosen)
  })
})
