import { describe, expect, it } from 'vitest'

import { QUANTITY_DRIVER_KEYS, measureHouse } from '../src'
import { cabin, options, rooms } from './fixtures'

describe('takeoff of a 6 × 6 m gable cabin', () => {
  const { takeoff, metrics, frame } = measureHouse({ design: cabin, options, rooms })

  it('measures every registered driver', () => {
    expect(Object.keys(takeoff).sort()).toEqual([...QUANTITY_DRIVER_KEYS].sort())
  })

  it('derives elevations from the standards', () => {
    expect(frame.levels[0]).toMatchObject({ floor: 600, ceiling: 3300 })
    expect(frame.roof.eaveBase).toBe(3550)
    expect(frame.roof.ridgeElevation).toBeCloseTo(3550 + 3000 * Math.tan(Math.PI / 6), 6)
  })

  it('measures walls including both gables, minus openings for the facade', () => {
    const gableTriangle = 0.5 * 6 * 3 * Math.tan(Math.PI / 6)
    const walls = 2 * 6 * 2.95 + 2 * (6 * 2.95 + gableTriangle)
    expect(takeoff.wallArea).toBeCloseTo(walls, 2)
    expect(takeoff.facadeArea).toBeCloseTo(walls - 1.2 * 1.4 - 0.9 * 2.1, 2)
  })

  it('measures the roof along the slopes with overhangs', () => {
    const slope = (3 + 0.5) / Math.cos(Math.PI / 6)
    expect(takeoff.roofArea).toBeCloseTo(2 * slope * (6 + 2 * 0.4), 2)
    expect(takeoff.roofInsulationArea).toBe(0)
    expect(takeoff.ceilingArea).toBeCloseTo(5.51 * 5.51, 2)
  })

  it('computes net room areas inside walls and partitions', () => {
    expect(takeoff.totalArea).toBeCloseTo(17.66 + 12.15, 2)
    expect(metrics.bedrooms).toBe(1)
    expect(metrics.levels).toBe(1)
  })

  it('counts joinery, piles and the terrace', () => {
    expect(takeoff.windowCount).toBe(1)
    expect(takeoff.exteriorDoorCount).toBe(1)
    expect(takeoff.interiorDoorCount).toBe(1)
    expect(takeoff.windowArea).toBeCloseTo(1.68, 2)
    expect(takeoff.panoramicWindowArea).toBe(0)
    expect(takeoff.terraceArea).toBe(10)
    expect(takeoff.pileCount).toBe(16 + 4 * 2)
    expect(takeoff.perimeter).toBe(24)
  })
})

describe('options change the measured house', () => {
  it('panoramic style turns view windows into floor-length glazing', () => {
    const { takeoff } = measureHouse({
      design: cabin,
      options: { ...options, windowStyle: 'panoramic' },
      rooms,
    })
    expect(takeoff.panoramicWindowArea).toBeCloseTo(1.2 * (2.7 - 0.25 - 0.1), 2)
    expect(takeoff.windowArea).toBeCloseTo(takeoff.panoramicWindowArea, 2)
  })

  it('thicker insulation thickens the wall and reduces net area', () => {
    const thin = measureHouse({ design: cabin, options, rooms })
    const thick = measureHouse({ design: cabin, options: { ...options, insulation: 200 }, rooms })
    expect(thick.frame.spec.wallThickness - thin.frame.spec.wallThickness).toBe(50)
    expect(thick.takeoff.totalArea).toBeLessThan(thin.takeoff.totalArea)
  })

  it('terrace depth can be changed or the terrace removed', () => {
    const deeper = measureHouse({
      design: cabin,
      options: { ...options, terraceDepth: 3000 },
      rooms,
    })
    expect(deeper.takeoff.terraceArea).toBe(15)
    const none = measureHouse({ design: cabin, options: { ...options, terraceDepth: null }, rooms })
    expect(none.takeoff.terraceArea).toBe(0)
    expect(none.frame.terrace).toBeNull()
  })
})
