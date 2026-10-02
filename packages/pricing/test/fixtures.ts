import { Money, type TariffGrid } from '../src'

/** A compact grid with every feature the calculations rely on. */
export const grid: TariffGrid = {
  revision: 7,
  sections: [
    { key: 'foundation' },
    { key: 'frame' },
    { key: 'roof' },
    { key: 'terrace' },
    { key: 'engineering' },
  ],
  rates: [
    { code: 'piles', section: 'foundation', driver: 'pileCount', unitPrice: Money.ofRubles(6_500) },
    { code: 'frame', section: 'frame', driver: 'totalArea', unitPrice: Money.ofRubles(18_500) },
    {
      code: 'insulation-200',
      section: 'frame',
      driver: 'wallArea',
      unitPrice: Money.ofRubles(450),
      conditions: [{ option: 'insulation', anyOf: ['200'] }],
    },
    {
      code: 'roof-gable',
      section: 'roof',
      driver: 'roofArea',
      unitPrice: Money.ofRubles(2_400),
      conditions: [{ option: 'roof', anyOf: ['gable', 'shed'] }],
    },
    {
      code: 'roof-gambrel',
      section: 'roof',
      driver: 'roofArea',
      unitPrice: Money.ofRubles(3_100),
      conditions: [{ option: 'roof', anyOf: ['gambrel'] }],
    },
    { code: 'deck', section: 'terrace', driver: 'terraceArea', unitPrice: Money.ofRubles(9_000) },
    {
      code: 'heating',
      section: 'engineering',
      driver: 'totalArea',
      unitPrice: Money.ofRubles(2_000),
      conditions: [{ option: 'engineering', anyOf: ['heating'] }],
    },
  ],
  completeness: [
    { key: 'shell', sections: ['foundation', 'frame', 'roof', 'terrace'] },
    { key: 'turnkey', sections: ['foundation', 'frame', 'roof', 'terrace', 'engineering'] },
  ],
  schedule: {
    workingDaysPerWeek: 5,
    phases: [{ key: 'production' }, { key: 'site' }],
    stages: [
      {
        key: 'kit',
        phase: 'production',
        section: 'frame',
        driver: 'totalArea',
        baseDays: 5,
        daysPerUnit: 0.1,
        dependsOn: [],
      },
      {
        key: 'piles',
        phase: 'site',
        section: 'foundation',
        baseDays: 3,
        daysPerUnit: 0,
        dependsOn: [],
      },
      {
        key: 'assembly',
        phase: 'site',
        section: 'frame',
        driver: 'totalArea',
        baseDays: 2,
        daysPerUnit: 0.03,
        dependsOn: ['kit', 'piles'],
      },
      {
        key: 'deck',
        phase: 'site',
        section: 'terrace',
        driver: 'terraceArea',
        baseDays: 2,
        daysPerUnit: 0.2,
        dependsOn: ['assembly'],
      },
      {
        key: 'heating',
        phase: 'site',
        section: 'engineering',
        baseDays: 6,
        daysPerUnit: 0,
        dependsOn: ['assembly'],
        conditions: [{ option: 'engineering', anyOf: ['heating'] }],
      },
      {
        key: 'handover',
        phase: 'site',
        baseDays: 1,
        daysPerUnit: 0,
        dependsOn: ['deck', 'heating'],
      },
    ],
  },
}

export const quantities = {
  pileCount: 24,
  totalArea: 100,
  wallArea: 112.5,
  roofArea: 130.25,
  terraceArea: 12,
}
