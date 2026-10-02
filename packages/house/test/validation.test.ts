import { describe, expect, it } from 'vitest'

import { HouseError, measureHouse, type HouseDesign } from '../src'
import { cabin, options, rooms } from './fixtures'

const measure = (design: HouseDesign, overrides = {}) =>
  measureHouse({ design, options: { ...options, ...overrides }, rooms })

const code = (run: () => unknown) => {
  try {
    run()
  } catch (error) {
    return error instanceof HouseError ? error.code : 'OTHER'
  }
  return undefined
}

describe('house invariants', () => {
  it('rejects rooms outside the footprint and overlapping rooms', () => {
    const outside = {
      ...cabin,
      rooms: [{ id: 'r', kind: 'living', level: 0, x: 5000, y: 0, width: 2000, depth: 1000 }],
    }
    expect(code(() => measure(outside))).toBe('ROOM_OUT_OF_BOUNDS')
    const overlap = {
      ...cabin,
      rooms: [
        { id: 'a', kind: 'living', level: 0, x: 0, y: 0, width: 4000, depth: 4000 },
        { id: 'b', kind: 'living', level: 0, x: 3000, y: 3000, width: 3000, depth: 3000 },
      ],
    }
    expect(code(() => measure(overlap))).toBe('ROOMS_OVERLAP')
  })

  it('rejects openings that leave their wall or overlap', () => {
    const [window] = cabin.openings
    if (window === undefined) throw new Error('fixture')
    const outside = { ...cabin, openings: [{ ...window, offset: 5500 }] }
    expect(code(() => measure(outside))).toBe('OPENING_OUT_OF_WALL')
    const tooTall = { ...cabin, openings: [{ ...window, height: 2500 }] }
    expect(code(() => measure(tooTall))).toBe('OPENING_OUT_OF_WALL')
    const overlap = { ...cabin, openings: [window, { ...window, id: 'w2', offset: 1500 }] }
    expect(code(() => measure(overlap))).toBe('OPENINGS_OVERLAP')
  })

  it('rejects options the house cannot take', () => {
    expect(code(() => measure(cabin, { roofKind: 'dome' }))).toBe('UNKNOWN_OPTION')
    expect(code(() => measure(cabin, { roofPitch: 70 }))).toBe('UNKNOWN_OPTION')
    expect(
      code(() => measure({ ...cabin, attic: true }, { roofKind: 'shed', roofPitch: 10 })),
    ).toBe('UNKNOWN_OPTION')
    expect(code(() => measure(cabin, { facadeColor: 'green' }))).toBe('UNKNOWN_OPTION')
  })

  it('rejects duplicate ids and elements on missing levels', () => {
    const duplicate = {
      ...cabin,
      doors: [{ id: 'living', level: 0, x: 1, y: 1, width: 800, orientation: 'vertical' as const }],
    }
    expect(code(() => measure(duplicate))).toBe('DUPLICATE_ID')
    const upstairs = {
      ...cabin,
      doors: [{ id: 'x', level: 1, x: 1, y: 1, width: 800, orientation: 'vertical' as const }],
    }
    expect(code(() => measure(upstairs))).toBe('UNKNOWN_LEVEL')
  })

  it('rejects a terrace longer than its wall', () => {
    const terrace = {
      ...cabin,
      terrace: { side: 'front' as const, offset: 2000, length: 5000, depth: 2000 },
    }
    expect(code(() => measure(terrace))).toBe('TERRACE_OUT_OF_WALL')
  })
})
