import { describe, expect, it } from 'vitest'

import { planSchedule } from '../src'
import { grid, quantities } from './fixtures'

const selections = { roof: 'gable', engineering: ['heating'] }

describe('planSchedule', () => {
  it('runs production and foundation in parallel and waits for both before assembly', () => {
    const schedule = planSchedule(grid, { quantities, selections, completeness: 'turnkey' })
    const byKey = Object.fromEntries(schedule.stages.map((stage) => [stage.key, stage]))
    expect(byKey.kit).toMatchObject({ startDay: 0, endDay: 15 })
    expect(byKey.piles).toMatchObject({ startDay: 0, endDay: 3 })
    expect(byKey.assembly).toMatchObject({ startDay: 15, durationDays: 5 })
    expect(byKey.deck).toMatchObject({ startDay: 20, durationDays: 5 })
    expect(byKey.heating).toMatchObject({ startDay: 20, durationDays: 6 })
    expect(byKey.handover).toMatchObject({ startDay: 26, endDay: 27 })
    expect(schedule.totalDays).toBe(27)
    expect(schedule.totalWeeks).toBe(6)
  })

  it('aggregates phase spans for production and on-site work', () => {
    const schedule = planSchedule(grid, { quantities, selections, completeness: 'turnkey' })
    expect(schedule.phases).toEqual([
      { key: 'production', startDay: 0, endDay: 15, durationDays: 15 },
      { key: 'site', startDay: 0, endDay: 27, durationDays: 27 },
    ])
  })

  it('keeps dependency chains intact when a stage is out of scope', () => {
    const schedule = planSchedule(grid, { quantities, selections, completeness: 'shell' })
    expect(schedule.stages.some((stage) => stage.key === 'heating')).toBe(false)
    const handover = schedule.stages.find((stage) => stage.key === 'handover')
    expect(handover?.startDay).toBe(25)
  })

  it('skips quantity-driven stages that the house does not have', () => {
    const schedule = planSchedule(grid, {
      quantities: { ...quantities, terraceArea: 0 },
      selections: {},
      completeness: 'shell',
    })
    expect(schedule.stages.map((stage) => stage.key)).toEqual([
      'kit',
      'piles',
      'assembly',
      'handover',
    ])
  })

  it('does not let float noise add a working day', () => {
    // 2 + 100 × 0.03 is 5.000000000000001 in IEEE-754.
    const schedule = planSchedule(grid, { quantities, selections: {}, completeness: 'shell' })
    expect(schedule.stages.find((stage) => stage.key === 'assembly')?.durationDays).toBe(5)
  })
})
