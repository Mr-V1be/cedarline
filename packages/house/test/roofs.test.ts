import { describe, expect, it } from 'vitest'

import { ROOF_KINDS, measureHouse } from '../src'
import { cabin, options, rooms } from './fixtures'

describe('roof kinds', () => {
  it('shed roof makes the front wall the tall one', () => {
    const { frame } = measureHouse({
      design: cabin,
      options: { ...options, roofKind: 'shed', roofPitch: 10 },
      rooms,
    })
    const front = frame.walls.find((wall) => wall.side === 'front')
    const back = frame.walls.find((wall) => wall.side === 'back')
    const rise = 6000 * Math.tan((10 * Math.PI) / 180)
    expect(Math.max(...(front?.polygon.map(([, v]) => v) ?? []))).toBeCloseTo(3550 + rise, 6)
    expect(Math.max(...(back?.polygon.map(([, v]) => v) ?? []))).toBe(3550)
  })

  it('gambrel profile is symmetric with a steep lower slope', () => {
    const profile = ROOF_KINDS.gambrel.profile(8000, 25)
    expect(profile.points).toHaveLength(5)
    const [start, lowerBreak, ridge, upperBreak, end] = profile.points
    expect(start).toEqual([0, 0])
    expect(end).toEqual([8000, 0])
    expect(lowerBreak?.[1]).toBeCloseTo(upperBreak?.[1] ?? 0, 9)
    const lowerPitch = Math.atan2(lowerBreak?.[1] ?? 0, lowerBreak?.[0] ?? 1)
    const upperPitch = Math.atan2(
      (ridge?.[1] ?? 0) - (lowerBreak?.[1] ?? 0),
      4000 - (lowerBreak?.[0] ?? 0),
    )
    expect(lowerPitch).toBeGreaterThan(upperPitch)
  })

  it('an attic house measures insulated slopes instead of a ceiling', () => {
    const attic = {
      ...cabin,
      attic: true,
      rooms: [
        ...cabin.rooms,
        { id: 'loft', kind: 'bedroom', level: 1, x: 0, y: 0, width: 6000, depth: 6000 },
      ],
    }
    const { takeoff, metrics, frame } = measureHouse({
      design: attic,
      options: { ...options, roofKind: 'gambrel' },
      rooms,
    })
    expect(metrics.levels).toBe(2)
    expect(metrics.bedrooms).toBe(2)
    expect(takeoff.ceilingArea).toBe(0)
    expect(takeoff.roofInsulationArea).toBeGreaterThan(0)
    expect(frame.levels[1]).toMatchObject({ attic: true, floor: 3600 })
    expect(frame.roof.eaveBase).toBe(3600 + 400)
  })
})
