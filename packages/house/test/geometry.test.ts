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
  it('starts at the foot of the terrace steps when the terrace covers the entrance', () => {
    const { approach } = houseModel(house)
    expect(approach).not.toBeNull()
    // Terrace centre along the front wall (x = 3 m from the left corner) and in front of it.
    expect(approach?.start[0]).toBeCloseTo(0, 6)
    expect(approach?.start[2]).toBeGreaterThan(3 + 2)
    expect(approach?.direction).toEqual([0, 0, 1])
  })

  it('starts at the door without a terrace', () => {
    const bare = measureHouse({ design: cabin, options: { ...options, terraceDepth: null }, rooms })
    const { approach } = houseModel(bare)
    expect(approach?.start[0]).toBeCloseTo(4.25 - 3, 6)
    expect(approach?.start[2]).toBeCloseTo(3, 6)
  })
})

describe('site anchors', () => {
  it('report the wall footprint and the ground under the terrace and its steps', () => {
    const { site } = houseModel(house)
    expect(site.footprint).toEqual({ min: [-3, -3], max: [3, 3] })
    // Cabin terrace: front side, 0.5–5.5 m along the wall, 2 m deep plus its steps.
    expect(site.terrace?.min[0]).toBeCloseTo(-2.5, 6)
    expect(site.terrace?.max[0]).toBeCloseTo(2.5, 6)
    expect(site.terrace?.min[1]).toBeCloseTo(3, 6)
    expect(site.terrace?.max[1]).toBeGreaterThan(3 + 2)
  })

  it('have no terrace when it is removed', () => {
    const bare = measureHouse({ design: cabin, options: { ...options, terraceDepth: null }, rooms })
    expect(houseModel(bare).site.terrace).toBeNull()
  })
})
