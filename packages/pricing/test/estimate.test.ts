import { describe, expect, it } from 'vitest'

import { buildEstimate, lowestQuote, Money, PricingError, quoteEveryCompleteness } from '../src'
import { grid, quantities } from './fixtures'

const selections = { roof: 'gable', insulation: '150', engineering: ['heating', 'water'] }

describe('buildEstimate', () => {
  it('prices only the sections of the selected completeness, in grid order', () => {
    const estimate = buildEstimate(grid, { quantities, selections, completeness: 'shell' })
    expect(estimate.sections.map((section) => section.key)).toEqual([
      'foundation',
      'frame',
      'roof',
      'terrace',
    ])
    expect(estimate.revision).toBe(7)
  })

  it('applies a rate only when its conditions hold', () => {
    const estimate = buildEstimate(grid, { quantities, selections, completeness: 'shell' })
    const roof = estimate.sections.find((section) => section.key === 'roof')
    expect(roof?.lines.map((line) => line.code)).toEqual(['roof-gable'])
    const frame = estimate.sections.find((section) => section.key === 'frame')
    expect(frame?.lines.map((line) => line.code)).toEqual(['frame'])
  })

  it('matches multi-valued selections such as engineering systems', () => {
    const estimate = buildEstimate(grid, { quantities, selections, completeness: 'turnkey' })
    const engineering = estimate.sections.find((section) => section.key === 'engineering')
    expect(engineering?.subtotal).toBe(Money.ofRubles(200_000))
  })

  it('sums exact line amounts into subtotals and the total', () => {
    const estimate = buildEstimate(grid, {
      quantities,
      selections: { ...selections, insulation: '200' },
      completeness: 'shell',
    })
    const expected =
      24 * 650_000 + 100 * 1_850_000 + 112.5 * 45_000 + 130.25 * 240_000 + 12 * 900_000
    expect(estimate.total).toBe(expected)
  })

  it('drops lines and sections whose quantity is zero', () => {
    const estimate = buildEstimate(grid, {
      quantities: { ...quantities, terraceArea: 0 },
      selections,
      completeness: 'shell',
    })
    expect(estimate.sections.some((section) => section.key === 'terrace')).toBe(false)
  })

  it('fails loudly when the takeoff lacks a quantity the grid needs', () => {
    const { roofArea: _omitted, ...withoutRoof } = quantities
    expect(() =>
      buildEstimate(grid, { quantities: withoutRoof, selections, completeness: 'shell' }),
    ).toThrow(expect.objectContaining({ code: 'MISSING_QUANTITY' }))
  })

  it('rejects an unknown completeness level', () => {
    expect(() => buildEstimate(grid, { quantities, selections, completeness: 'nope' })).toThrow(
      PricingError,
    )
  })
})

describe('quoteEveryCompleteness / lowestQuote', () => {
  it('quotes each level and picks the cheapest as the catalog price', () => {
    const quotes = quoteEveryCompleteness(grid, { quantities, selections })
    expect(quotes.map((entry) => entry.estimate.completeness)).toEqual(['shell', 'turnkey'])
    expect(lowestQuote(quotes)?.estimate.completeness).toBe('shell')
    expect(lowestQuote([])).toBeUndefined()
  })
})
