import { DEFAULT_STANDARDS, type HouseDesign, type RoomKindCatalog } from '@kedrovnik/house'
import { Money, type TariffGrid } from '@kedrovnik/pricing'

import type { ConfiguratorModel, ConfiguratorOffer, ProjectBlueprint } from '../src'

export const rooms: RoomKindCatalog = {
  living: { bedroom: false, wetZone: false, stair: false },
  bedroom: { bedroom: true, wetZone: false, stair: false },
  stair: { bedroom: false, wetZone: false, stair: true },
}

const window = (id: string, offset: number, level = 0) => ({
  id,
  type: 'window' as const,
  role: 'view' as const,
  side: 'front' as const,
  level,
  offset,
  width: 1200,
  height: 1400,
  sill: 900,
})

const entrance = {
  id: 'd1',
  type: 'door' as const,
  role: 'standard' as const,
  side: 'front' as const,
  level: 0,
  offset: 2500,
  width: 900,
  height: 2100,
  sill: 0,
}

/** 6 × 6 m single-storey house with two front windows and a door onto the terrace. */
const pine: HouseDesign = {
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
  openings: [window('w1', 1000), entrance, window('w2', 3800)],
  doors: [],
  terrace: { entrance: 'd1', length: 6000, depth: 2000, reach: 'both' },
  chimney: null,
}

/** The same footprint with an attic bedroom (вариант с мансардой). */
const pineAttic: HouseDesign = {
  ...pine,
  attic: true,
  rooms: [
    { id: 'living', kind: 'living', level: 0, x: 0, y: 0, width: 4000, depth: 6000 },
    { id: 'stair', kind: 'stair', level: 0, x: 4000, y: 0, width: 2000, depth: 6000 },
    { id: 'loft', kind: 'bedroom', level: 1, x: 0, y: 0, width: 6000, depth: 6000 },
  ],
}

export const pineBlueprint: ProjectBlueprint = {
  slug: 'pine',
  design: pine,
  defaults: {
    options: {
      roofKind: 'shed',
      roofPitch: 12,
      facadeFinish: 'planken',
      facadeColor: '#3A3E3C',
      windowStyle: 'standard',
      insulation: 150,
    },
    engineering: ['electrics'],
  },
  // 2400 × 2400 squeezes the two windows into each other: offered, but not buildable.
  sizes: [
    { width: 7200, depth: 6000 },
    { width: 2400, depth: 2400 },
  ],
  mirrorable: true,
}

export const pineAtticBlueprint: ProjectBlueprint = {
  slug: 'pine-attic',
  design: pineAttic,
  defaults: {
    ...pineBlueprint.defaults,
    options: { ...pineBlueprint.defaults.options, roofKind: 'gable', roofPitch: 35 },
  },
  sizes: [],
  mirrorable: false,
}

export const offer: ConfiguratorOffer = {
  roofs: ['gable', 'shed', 'gambrel'],
  facades: [
    { finish: 'planken', colours: ['#3a3e3c', '#b98b5a'] },
    { finish: 'fiber-cement', colours: ['#E4E1D8', '#6c6f6c'] },
  ],
  windowStyles: ['standard', 'panoramic'],
  terrace: { depths: [1500, 2500], removable: true },
  insulation: [150, 200],
  engineering: [
    { key: 'electrics', requires: [] },
    { key: 'heating', requires: ['electrics'] },
    { key: 'water', requires: ['heating'] },
  ],
  rules: [
    {
      id: 'panoramic-needs-200',
      when: [
        { option: 'windows', anyOf: ['panoramic'] },
        { option: 'insulation', anyOf: ['150'] },
      ],
    },
  ],
}

export const grid: TariffGrid = {
  revision: 3,
  advertisedRounding: { step: Money.ofRubles(1_000), mode: 'up' },
  sections: [{ key: 'frame' }, { key: 'windows' }, { key: 'terrace' }, { key: 'engineering' }],
  rates: [
    { code: 'frame', section: 'frame', driver: 'totalArea', unitPrice: Money.ofRubles(20_000) },
    {
      code: 'walls-200',
      section: 'frame',
      driver: 'wallArea',
      unitPrice: Money.ofRubles(500),
      conditions: [{ option: 'insulation', anyOf: ['200'] }],
    },
    {
      code: 'panoramic',
      section: 'windows',
      driver: 'panoramicWindowArea',
      unitPrice: Money.ofRubles(10_000),
    },
    { code: 'deck', section: 'terrace', driver: 'terraceArea', unitPrice: Money.ofRubles(9_000) },
    {
      code: 'electrics',
      section: 'engineering',
      driver: 'totalArea',
      unitPrice: Money.ofRubles(2_000),
      conditions: [{ option: 'engineering', anyOf: ['electrics'] }],
    },
    {
      code: 'heating',
      section: 'engineering',
      driver: 'totalArea',
      unitPrice: Money.ofRubles(3_000),
      conditions: [{ option: 'engineering', anyOf: ['heating'] }],
    },
  ],
  completeness: [
    { key: 'shell', sections: ['frame', 'windows', 'terrace'] },
    { key: 'full', sections: ['frame', 'windows', 'terrace', 'engineering'] },
  ],
  schedule: {
    workingDaysPerWeek: 5,
    phases: [{ key: 'production' }, { key: 'site' }],
    stages: [
      {
        key: 'kit',
        phase: 'production',
        driver: 'totalArea',
        baseDays: 5,
        daysPerUnit: 0.1,
        dependsOn: [],
      },
      {
        key: 'assembly',
        phase: 'site',
        driver: 'totalArea',
        baseDays: 3,
        daysPerUnit: 0.05,
        dependsOn: ['kit'],
      },
    ],
  },
}

export const model: ConfiguratorModel = {
  family: [pineBlueprint, pineAtticBlueprint],
  offer,
  house: { rooms, standards: DEFAULT_STANDARDS },
  grid,
}
