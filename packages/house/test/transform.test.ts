import { describe, expect, it } from 'vitest'

import { measureHouse, mirrorDesign, resizeDesign, type HouseDesign } from '../src'
import { cabin, options, rooms } from './fixtures'

const measure = (design: HouseDesign) => measureHouse({ design, options, rooms })

describe('design transforms', () => {
  it('resizes rooms on the grid and keeps windows centred and valid', () => {
    const bigger = resizeDesign(cabin, 7200, 6600)
    const house = measure(bigger)
    expect(house.frame.spec.width).toBe(7200)
    expect(bigger.rooms.map((room) => room.width)).toEqual([7200, 7200])
    const [window] = bigger.openings
    expect(window?.offset).toBe(1320)
    expect(house.takeoff.totalArea).toBeGreaterThan(measure(cabin).takeoff.totalArea)
    expect(bigger.terrace?.length).toBe(6000)
  })

  it('mirrors rooms, openings, doors and the terrace', () => {
    const mirrored = mirrorDesign(cabin)
    expect(mirrored.openings.find((opening) => opening.id === 'd1')?.offset).toBe(6000 - 3800 - 900)
    expect(mirrored.terrace).toMatchObject({ entrance: 'd1', reach: 'right' })
    expect(mirrorDesign(mirrorDesign(cabin))).toEqual(cabin)
    expect(measure(mirrored).takeoff.totalArea).toBe(measure(cabin).takeoff.totalArea)
  })

  it('moves side-wall openings to the opposite wall when mirrored', () => {
    const side = {
      ...cabin,
      terrace: null,
      openings: [
        {
          id: 's1',
          type: 'window' as const,
          role: 'standard' as const,
          side: 'left' as const,
          level: 0,
          offset: 1000,
          width: 1200,
          height: 1400,
          sill: 900,
        },
      ],
    }
    const mirrored = mirrorDesign(side)
    expect(mirrored.openings[0]).toMatchObject({ side: 'right', offset: 6000 - 1000 - 1200 })
    expect(() => measure(mirrored)).not.toThrow()
  })
})
