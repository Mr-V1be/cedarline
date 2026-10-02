import { describe, expect, it } from 'vitest'

import {
  WallAssemblyError,
  resolveWall,
  type WallLayer,
} from '@/modules/technology/domain/wall-assembly'

const layers: WallLayer[] = [
  { key: 'cladding', role: 'cladding', thickness: 20, conductivity: null },
  { key: 'gap', role: 'air-gap', thickness: 30, conductivity: null },
  { key: 'frame', role: 'insulation', thickness: 0, conductivity: 0.045 },
  { key: 'lining', role: 'lining', thickness: 14, conductivity: 0.18 },
]

describe('wall assembly', () => {
  it('takes the insulation thickness from the selected option', () => {
    const wall = resolveWall(layers, 200)
    expect(wall.totalThickness).toBe(264)
    expect(wall.skinThickness).toBe(64)
  })

  it('sums thermal resistance of the layers and both surfaces', () => {
    const expected = 1 / 8.7 + 0.15 / 0.045 + 0.014 / 0.18 + 1 / 12
    expect(resolveWall(layers, 150).thermalResistance).toBeCloseTo(expected, 2)
  })

  it('needs exactly one insulation layer', () => {
    expect(() =>
      resolveWall(
        layers.filter((layer) => layer.role !== 'insulation'),
        150,
      ),
    ).toThrow(WallAssemblyError)
  })
})
