import { describe, expect, it } from 'vitest'

import {
  Money,
  advertisedPrice,
  quoteEveryCompleteness,
  roundMoney,
  validateTariffGrid,
} from '../src'
import { grid, quantities } from './fixtures'

const thousand = Money.ofRubles(1_000)

describe('roundMoney', () => {
  it('rounds up to the step, keeping exact multiples', () => {
    expect(roundMoney(Money.ofKopecks(509_376_137), { step: thousand, mode: 'up' })).toBe(
      Money.ofRubles(5_094_000),
    )
    expect(roundMoney(Money.ofRubles(5_094_000), { step: thousand, mode: 'up' })).toBe(
      Money.ofRubles(5_094_000),
    )
    expect(roundMoney(Money.ofKopecks(1), { step: thousand, mode: 'up' })).toBe(thousand)
  })

  it('supports rounding down and to the nearest step', () => {
    expect(roundMoney(Money.ofRubles(5_093_761), { step: thousand, mode: 'down' })).toBe(
      Money.ofRubles(5_093_000),
    )
    expect(roundMoney(Money.ofRubles(5_093_499), { step: thousand, mode: 'nearest' })).toBe(
      Money.ofRubles(5_093_000),
    )
    expect(roundMoney(Money.ofRubles(5_093_500), { step: thousand, mode: 'nearest' })).toBe(
      Money.ofRubles(5_094_000),
    )
  })
})

describe('advertisedPrice', () => {
  it('is the cheapest quote rounded up, never below any real quote', () => {
    const quotes = quoteEveryCompleteness(grid, { quantities, selections: { roof: 'gable' } })
    const price = advertisedPrice(grid, quotes)
    const cheapest = Math.min(...quotes.map((entry) => entry.estimate.total))
    expect(price).toBeDefined()
    expect(price! % thousand).toBe(0)
    expect(price!).toBeGreaterThanOrEqual(cheapest)
    expect(price! - cheapest).toBeLessThan(thousand)
  })

  it('rejects a grid with an invalid rounding rule', () => {
    expect(() =>
      validateTariffGrid({ ...grid, advertisedRounding: { step: Money.zero, mode: 'up' } }),
    ).toThrow(expect.objectContaining({ code: 'INVALID_MONEY' }))
  })
})
