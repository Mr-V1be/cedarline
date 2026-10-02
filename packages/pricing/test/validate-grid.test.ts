import { describe, expect, it } from 'vitest'

import { validateTariffGrid, type TariffGrid } from '../src'
import { grid } from './fixtures'

const withSchedule = (stages: TariffGrid['schedule']['stages']): TariffGrid => ({
  ...grid,
  schedule: { ...grid.schedule, stages },
})

describe('validateTariffGrid', () => {
  it('accepts a consistent grid', () => {
    expect(validateTariffGrid(grid)).toBe(grid)
  })

  it('rejects duplicate rate codes', () => {
    const duplicate = { ...grid, rates: [...grid.rates, grid.rates[0]!] }
    expect(() => validateTariffGrid(duplicate)).toThrow(
      expect.objectContaining({ code: 'DUPLICATE_KEY' }),
    )
  })

  it('rejects references to unknown sections', () => {
    const broken = { ...grid, completeness: [{ key: 'x', sections: ['ghost'] }] }
    expect(() => validateTariffGrid(broken)).toThrow(
      expect.objectContaining({ code: 'UNKNOWN_REFERENCE' }),
    )
  })

  it('rejects stage dependency cycles', () => {
    const cyclic = withSchedule([
      { key: 'a', phase: 'site', baseDays: 1, daysPerUnit: 0, dependsOn: ['b'] },
      { key: 'b', phase: 'site', baseDays: 1, daysPerUnit: 0, dependsOn: ['a'] },
    ])
    expect(() => validateTariffGrid(cyclic)).toThrow(
      expect.objectContaining({ code: 'DEPENDENCY_CYCLE' }),
    )
  })

  it('rejects negative norms and an impossible working week', () => {
    const negative = withSchedule([
      { key: 'a', phase: 'site', baseDays: -1, daysPerUnit: 0, dependsOn: [] },
    ])
    expect(() => validateTariffGrid(negative)).toThrow(
      expect.objectContaining({ code: 'INVALID_NORM' }),
    )
    const week = { ...grid, schedule: { ...grid.schedule, workingDaysPerWeek: 8 } }
    expect(() => validateTariffGrid(week)).toThrow(
      expect.objectContaining({ code: 'INVALID_NORM' }),
    )
  })

  it('requires at least one completeness level', () => {
    expect(() => validateTariffGrid({ ...grid, completeness: [] })).toThrow(
      expect.objectContaining({ code: 'EMPTY_COMPLETENESS' }),
    )
  })
})
