import { describe, expect, it } from 'vitest'

import { MATERIAL_SLOTS, houseModel, housePlans, measureHouse } from '../src'
import { cabin, options, rooms } from './fixtures'

const house = measureHouse({ design: { ...cabin, chimney: { x: 4500, y: 2000 } }, options, rooms })

describe('house model', () => {
  const model = houseModel(house)

  it('emits valid indexed triangles with unit normals in known slots', () => {
    expect(model.parts.length).toBeGreaterThan(5)
    for (const part of model.parts) {
      expect(MATERIAL_SLOTS).toContain(part.slot)
      const vertices = part.positions.length / 3
      expect(part.normals.length).toBe(part.positions.length)
      expect(part.uvs.length / 2).toBe(vertices)
      expect(part.indices.length % 3).toBe(0)
      expect(Math.max(...part.indices)).toBeLessThan(vertices)
      for (let index = 0; index < part.normals.length; index += 3) {
        const length = Math.hypot(
          part.normals[index] ?? 0,
          part.normals[index + 1] ?? 0,
          part.normals[index + 2] ?? 0,
        )
        expect(length).toBeCloseTo(1, 5)
      }
    }
  })

  it('stands on the ground and spans the footprint plus overhangs', () => {
    expect(model.bounds.min[1]).toBeCloseTo(0, 6)
    expect(model.bounds.max[0]).toBeCloseTo(3 + 0.4, 6)
    expect(model.bounds.max[1]).toBeGreaterThan(model.ridgeHeight)
    expect(model.bounds.max[2]).toBeGreaterThan(3 + 2)
  })

  it('makes every roofing face look upwards', () => {
    const roof = model.parts.find((part) => part.slot === 'roof')
    expect(roof).toBeDefined()
    for (let index = 1; index < (roof?.normals.length ?? 0); index += 3) {
      expect(roof?.normals[index]).toBeGreaterThan(0)
    }
  })
})

describe('floor plans', () => {
  const [ground] = housePlans(house, rooms)

  it('lists rooms with net areas that add up to the total', () => {
    expect(ground?.rooms.map((room) => room.area)).toEqual([17.66, 12.15])
    expect(ground?.totalArea).toBe(house.takeoff.totalArea)
  })

  it('places openings across the wall thickness', () => {
    const window = ground?.openings.find((opening) => opening.id === 'w1')
    expect(window?.rect).toEqual({ x0: 1000, y0: 6000 - 245, x1: 2200, y1: 6000 })
  })

  it('builds partition and overall dimension chains', () => {
    expect(ground?.dimensions).toEqual([
      { side: 'bottom', tier: 0, marks: [0, 6000] },
      { side: 'right', tier: 0, marks: [0, 3500, 6000] },
      { side: 'right', tier: 1, marks: [0, 6000] },
    ])
  })
})

describe('approach', () => {
  // Door centre 4.25 m along the front (world x = 1.25 m); three 320 mm treads.
  it('starts at the foot of the terrace steps in front of the door', () => {
    const { approach } = houseModel(house)
    expect(approach?.start[0]).toBeCloseTo(1.25, 6)
    expect(approach?.start[2]).toBeCloseTo(3 + 2 + 0.96, 6)
    expect(approach?.direction).toEqual([0, 0, 1])
  })

  it('starts at the foot of the porch steps without a terrace', () => {
    const bare = measureHouse({ design: cabin, options: { ...options, terraceDepth: null }, rooms })
    const { approach } = houseModel(bare)
    expect(approach?.start[0]).toBeCloseTo(1.25, 6)
    expect(approach?.start[2]).toBeCloseTo(3 + 1.5 + 0.96, 6)
  })
})

describe('site anchors', () => {
  it('report the wall footprint and the ground under the terrace and its steps', () => {
    const { site } = houseModel(house)
    expect(site.footprint).toEqual({ min: [-3, -3], max: [3, 3] })
    // Terrace 0.1–5.1 m along the front, 2 m deep; steps 1.6 m wide centred on the door.
    const [terrace] = site.landings
    expect(terrace?.deck.min[0]).toBeCloseTo(-2.9, 6)
    expect(terrace?.deck.max[0]).toBeCloseTo(2.1, 6)
    expect(terrace?.deck.max[1]).toBeCloseTo(5, 6)
    expect(terrace?.stair.min[0]).toBeCloseTo(0.45, 6)
    expect(terrace?.stair.max[0]).toBeCloseTo(2.05, 6)
    expect(terrace?.stair.max[1]).toBeCloseTo(5.96, 6)
  })

  it('keep a porch at the door when the terrace is removed', () => {
    const bare = measureHouse({ design: cabin, options: { ...options, terraceDepth: null }, rooms })
    const [porch, ...rest] = houseModel(bare).site.landings
    expect(rest).toEqual([])
    expect(porch?.deck.min[0]).toBeCloseTo(0.4, 6)
    expect(porch?.deck.max[0]).toBeCloseTo(2.1, 6)
    expect(porch?.deck.max[1]).toBeCloseTo(4.5, 6)
  })
})
