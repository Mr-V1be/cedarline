import type { HouseDesign, HouseOptions, RoomKindCatalog } from '../src'

export const rooms: RoomKindCatalog = {
  living: { bedroom: false, wetZone: false, stair: false },
  bedroom: { bedroom: true, wetZone: false, stair: false },
  bath: { bedroom: false, wetZone: true, stair: false },
}

/** 6 × 6 m single-storey house, gable roof with the ridge along the width. */
export const cabin: HouseDesign = {
  width: 6000,
  depth: 6000,
  storeys: 1,
  attic: false,
  storeyHeight: 2700,
  ridgeAxis: 'x',
  rooms: [
    { id: 'living', kind: 'living', level: 0, x: 0, y: 0, width: 6000, depth: 3500 },
    { id: 'bedroom', kind: 'bedroom', level: 0, x: 0, y: 3500, width: 6000, depth: 2500 },
  ],
  openings: [
    {
      id: 'w1',
      type: 'window',
      role: 'view',
      side: 'front',
      level: 0,
      offset: 1000,
      width: 1200,
      height: 1400,
      sill: 900,
    },
    {
      id: 'd1',
      type: 'door',
      role: 'standard',
      side: 'front',
      level: 0,
      offset: 3800,
      width: 900,
      height: 2100,
      sill: 0,
    },
  ],
  doors: [{ id: 'id1', level: 0, x: 3000, y: 3500, width: 800, orientation: 'horizontal' }],
  terrace: { side: 'front', offset: 500, length: 5000, depth: 2000 },
  chimney: null,
}

export const options: HouseOptions = {
  roofKind: 'gable',
  roofPitch: 30,
  facadeFinish: 'planken',
  facadeColor: '#5A6B5D',
  windowStyle: 'standard',
  insulation: 150,
}
