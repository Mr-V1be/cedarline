import { describe, expect, it } from 'vitest'

import {
  HouseError,
  entranceViolations,
  measureHouse,
  mirrorDesign,
  type HouseDesign,
  type HouseFrame,
  type OpeningDesign,
} from '../src'
import { cabin, options, rooms } from './fixtures'

const frameOf = (design: HouseDesign, terraceDepth?: number | null) =>
  measureHouse({
    design,
    options: terraceDepth === undefined ? options : { ...options, terraceDepth },
    rooms,
  }).frame

const opening = (id: string, type: 'window' | 'door', offset: number, width: number) =>
  ({
    id,
    type,
    role: 'standard',
    side: 'front',
    level: 0,
    offset,
    width,
    height: type === 'door' ? 2100 : 1400,
    sill: type === 'door' ? 0 : 900,
  }) satisfies OpeningDesign

const doorOf = (frame: HouseFrame, id = 'd1') => {
  const item = frame.walls.flatMap((wall) => wall.openings).find((o) => o.opening.id === id)
  if (item === undefined) throw new Error(`no opening ${id}`)
  return item
}

describe('entrance landings', () => {
  it('lays the terrace from its door the way it reaches, with the door at its end', () => {
    const [terrace] = frameOf(cabin).landings
    expect(terrace).toMatchObject({ kind: 'terrace', side: 'front', u0: 100, u1: 5100 })
    expect(terrace?.doors).toEqual(['d1'])
    // Steps centred on the door (4.25 m), as wide as the standard allows.
    expect(terrace?.stair).toMatchObject({ u0: 3450, u1: 5050, steps: 3, riser: 145 })
  })

  it('keeps the deck flush with the finished floor apart from the threshold drip', () => {
    const frame = frameOf(cabin)
    expect(frame.landings[0]?.deckTop).toBe((frame.levels[0]?.floor ?? 0) - 20)
  })

  it('shifts a terrace along at the wall end but keeps the door on it', () => {
    const toCorner: HouseDesign = {
      ...cabin,
      terrace: { entrance: 'd1', length: 4000, depth: 2000, reach: 'right' },
    }
    const [terrace] = frameOf(toCorner).landings
    expect(terrace).toMatchObject({ u0: 2000, u1: 6000 })
    expect(entranceViolations(frameOf(toCorner))).toEqual([])
  })

  it('gives a door without a terrace a porch of its own', () => {
    const [porch, ...rest] = frameOf(cabin, null).landings
    expect(rest).toEqual([])
    expect(porch).toMatchObject({ kind: 'porch', u0: 3400, u1: 5100, depth: 1500 })
    expect(porch?.stair).toMatchObject({ u0: 3450, u1: 5050, foot: 1500 + 3 * 320 })
  })

  it('gives a second door on the terrace the terrace, and one elsewhere a porch', () => {
    const twoDoors: HouseDesign = {
      ...cabin,
      openings: [...cabin.openings, opening('d2', 'door', 200, 800)],
      terrace: { entrance: 'd1', length: 5800, depth: 2000, reach: 'left' },
    }
    expect(frameOf(twoDoors).landings.map((landing) => landing.doors)).toEqual([['d1', 'd2']])
    const shortTerrace: HouseDesign = {
      ...twoDoors,
      terrace: { entrance: 'd1', length: 2000, depth: 2000, reach: 'left' },
    }
    const landings = frameOf(shortTerrace).landings
    expect(landings.map((landing) => [landing.kind, landing.doors])).toEqual([
      ['terrace', ['d1']],
      ['porch', ['d2']],
    ])
  })

  it('narrows and shifts the steps so that they never stand in front of a window', () => {
    // A window right of the door, 300 mm away: the steps keep clear of it.
    const tight: HouseDesign = {
      ...cabin,
      openings: [...cabin.openings, opening('w2', 'window', 5000, 800)],
    }
    const frame = frameOf(tight)
    const stair = frame.landings[0]?.stair
    expect(stair?.u1).toBeLessThanOrEqual(5000)
    expect(stair?.u0).toBeLessThanOrEqual(doorOf(frame).u0)
    expect(entranceViolations(frame)).toEqual([])
  })

  it('refuses a door squeezed between windows with no room for steps', () => {
    const squeezed: HouseDesign = {
      ...cabin,
      openings: [
        opening('w1', 'window', 1000, 2000),
        opening('d1', 'door', 3000, 800),
        opening('w2', 'window', 3800, 1200),
      ],
    }
    const attempt = () => frameOf(squeezed)
    expect(attempt).toThrow(HouseError)
    expect(attempt).toThrow(/stair-wide-enough/)
  })

  it('moves the terrace and its steps with the door in the mirrored plan', () => {
    const frame = frameOf(mirrorDesign(cabin))
    const door = doorOf(frame)
    const [terrace] = frame.landings
    expect(terrace?.u0).toBe(door.u0 - 400)
    expect(terrace?.stair.u0).toBeLessThanOrEqual(door.u0)
    expect(terrace?.stair.u1).toBeGreaterThanOrEqual(door.u1)
    expect(entranceViolations(frame)).toEqual([])
  })
})

describe('entrance rules', () => {
  const sound = frameOf(cabin)
  const withLanding = (patch: Partial<HouseFrame['landings'][number]>): HouseFrame => ({
    ...sound,
    landings: sound.landings.map((landing) => ({ ...landing, ...patch })),
  })
  const rules = (frame: HouseFrame) => entranceViolations(frame).map((item) => item.rule)

  it('accept the derived frame', () => {
    expect(entranceViolations(sound)).toEqual([])
  })

  it('catch a door that opens onto bare ground', () => {
    expect(rules({ ...sound, landings: [] })).toContain('door-opens-onto-landing')
    expect(rules(withLanding({ u0: 0, u1: 3000 }))).toContain('door-opens-onto-landing')
  })

  it('catch steps in front of a window and away from the door', () => {
    const stair = sound.landings[0]?.stair
    if (stair === undefined) throw new Error('no stair')
    const atWindow = withLanding({ stair: { ...stair, u0: 1000, u1: 2600 } })
    expect(rules(atWindow)).toEqual(
      expect.arrayContaining(['stair-at-entrance', 'stair-clear-of-windows']),
    )
  })

  it('catch a deck that sits a step below the floor', () => {
    const landing = sound.landings[0]
    if (landing === undefined) throw new Error('no landing')
    expect(rules(withLanding({ deckTop: landing.deckTop - 150 }))).toContain(
      'landing-at-floor-level',
    )
  })
})
