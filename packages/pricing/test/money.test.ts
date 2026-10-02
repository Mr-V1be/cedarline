import { describe, expect, it } from 'vitest'

import { Money, PricingError } from '../src'

describe('Money', () => {
  it('stores rubles as integer kopecks', () => {
    expect(Money.ofRubles(18_500)).toBe(1_850_000)
  })

  it('rejects fractional ruble rates and unsafe amounts', () => {
    expect(() => Money.ofRubles(10.5)).toThrow(PricingError)
    expect(() => Money.ofKopecks(Number.MAX_SAFE_INTEGER + 2)).toThrow(PricingError)
  })

  it('multiplies by measured quantities without float drift', () => {
    expect(Money.multiply(Money.ofRubles(18_500), 123.45)).toBe(228_382_500)
    expect(Money.multiply(Money.ofKopecks(10), 0.1 + 0.2)).toBe(3)
  })

  it('rounds half-up to the kopeck', () => {
    expect(Money.multiply(Money.ofKopecks(1), 0.5)).toBe(1)
    expect(Money.multiply(Money.ofKopecks(1), 0.499)).toBe(0)
    expect(Money.multiply(Money.ofKopecks(3), 0.5)).toBe(2)
  })

  it('rejects negative and non-finite quantities', () => {
    expect(() => Money.multiply(Money.ofRubles(1), -1)).toThrow(PricingError)
    expect(() => Money.multiply(Money.ofRubles(1), Number.NaN)).toThrow(PricingError)
  })

  it('presents whole rubles rounded half-up', () => {
    expect(Money.toWholeRubles(Money.ofKopecks(149))).toBe(1)
    expect(Money.toWholeRubles(Money.ofKopecks(150))).toBe(2)
  })
})
