import type { QuantityDriver } from '@kedrovnik/house'

import type { SelectionOption } from '@kedrovnik/configurator'

import { t, type Localized } from './localized'

interface ConditionSeed {
  readonly option: SelectionOption
  readonly values: readonly string[]
}

const when = (option: SelectionOption, ...values: string[]): ConditionSeed => ({ option, values })

export const SECTIONS: ReadonlyArray<{ key: string; name: Localized }> = [
  { key: 'foundation', name: t('Фундамент', 'Foundation') },
  { key: 'frame', name: t('Домокомплект и сборка каркаса', 'Kit and frame assembly') },
  { key: 'insulation', name: t('Утепление и мембраны', 'Insulation and membranes') },
  { key: 'roof', name: t('Кровля', 'Roofing') },
  { key: 'windows', name: t('Окна и двери', 'Windows and doors') },
  { key: 'facade', name: t('Фасад', 'Facade') },
  { key: 'terrace', name: t('Терраса', 'Terrace') },
  { key: 'logistics', name: t('Доставка и организация стройки', 'Delivery and site set-up') },
  { key: 'engineering', name: t('Инженерные системы', 'Building services') },
  { key: 'interior', name: t('Внутренняя отделка', 'Interior finishing') },
]

/** Rates in whole rubles per unit of the driver, 2026 price level. */
export const RATES: ReadonlyArray<{
  code: string
  name: Localized
  section: string
  driver: QuantityDriver
  unitPrice: number
  conditions?: readonly ConditionSeed[]
}> = [
  {
    code: 'piles',
    name: t('Винтовые сваи 108 мм с оголовками', 'Screw piles 108 mm with caps'),
    section: 'foundation',
    driver: 'pileCount',
    unitPrice: 7_900,
  },
  {
    code: 'strapping',
    name: t('Обвязка из клеёного бруса', 'Glulam ring beam'),
    section: 'foundation',
    driver: 'perimeter',
    unitPrice: 2_400,
  },
  {
    code: 'floor',
    name: t('Перекрытие пола с утеплением 200 мм', 'Ground floor with 200 mm insulation'),
    section: 'frame',
    driver: 'groundFloorArea',
    unitPrice: 6_800,
  },
  {
    code: 'walls-150',
    name: t('Каркас стен 50×150', 'Wall frame 50×150'),
    section: 'frame',
    driver: 'wallArea',
    unitPrice: 5_900,
    conditions: [when('insulation', '150')],
  },
  {
    code: 'walls-200',
    name: t('Каркас стен 50×200', 'Wall frame 50×200'),
    section: 'frame',
    driver: 'wallArea',
    unitPrice: 6_600,
    conditions: [when('insulation', '200')],
  },
  {
    code: 'slabs',
    name: t('Межэтажные перекрытия', 'Intermediate floors'),
    section: 'frame',
    driver: 'slabArea',
    unitPrice: 5_200,
  },
  {
    code: 'ceiling',
    name: t('Потолочное перекрытие', 'Ceiling structure'),
    section: 'frame',
    driver: 'ceilingArea',
    unitPrice: 3_600,
  },
  {
    code: 'rafters',
    name: t('Стропильная система', 'Rafters'),
    section: 'frame',
    driver: 'roofArea',
    unitPrice: 3_200,
    conditions: [when('roof', 'gable', 'shed')],
  },
  {
    code: 'rafters-gambrel',
    name: t('Стропильная система ломаной кровли', 'Gambrel rafters'),
    section: 'frame',
    driver: 'roofArea',
    unitPrice: 3_900,
    conditions: [when('roof', 'gambrel')],
  },
  {
    code: 'wall-wool-150',
    name: t('Утепление стен 150 мм', 'Wall insulation 150 mm'),
    section: 'insulation',
    driver: 'wallArea',
    unitPrice: 1_450,
    conditions: [when('insulation', '150')],
  },
  {
    code: 'wall-wool-200',
    name: t('Утепление стен 200 мм', 'Wall insulation 200 mm'),
    section: 'insulation',
    driver: 'wallArea',
    unitPrice: 1_900,
    conditions: [when('insulation', '200')],
  },
  {
    code: 'ceiling-wool',
    name: t('Утепление потолка 200 мм', 'Ceiling insulation 200 mm'),
    section: 'insulation',
    driver: 'ceilingArea',
    unitPrice: 1_500,
  },
  {
    code: 'slope-wool',
    name: t('Утепление скатов мансарды 200 мм', 'Attic slope insulation 200 mm'),
    section: 'insulation',
    driver: 'roofInsulationArea',
    unitPrice: 2_100,
  },
  {
    code: 'seam-roof',
    name: t('Фальцевая кровля с подкладочным ковром', 'Standing-seam roof with underlay'),
    section: 'roof',
    driver: 'roofArea',
    unitPrice: 2_900,
  },
  {
    code: 'gutters',
    name: t('Водосточная система', 'Gutters and downpipes'),
    section: 'roof',
    driver: 'perimeter',
    unitPrice: 1_300,
  },
  {
    code: 'windows',
    name: t(
      'Окна, деревоалюминий, двухкамерный стеклопакет',
      'Timber-aluminium triple-glazed windows',
    ),
    section: 'windows',
    driver: 'windowArea',
    unitPrice: 16_500,
  },
  {
    code: 'panoramic',
    name: t('Доплата за панорамное остекление', 'Panoramic glazing supplement'),
    section: 'windows',
    driver: 'panoramicWindowArea',
    unitPrice: 9_800,
  },
  {
    code: 'entrance-doors',
    name: t('Входные двери с терморазрывом', 'Thermally broken entrance doors'),
    section: 'windows',
    driver: 'exteriorDoorCount',
    unitPrice: 58_000,
  },
  {
    code: 'facade-timber',
    name: t('Имитация бруса с окраской', 'Painted timber imitation boards'),
    section: 'facade',
    driver: 'facadeArea',
    unitPrice: 2_900,
    conditions: [when('facade', 'timber-imitation')],
  },
  {
    code: 'facade-planken',
    name: t('Планкен с окраской', 'Painted planken boards'),
    section: 'facade',
    driver: 'facadeArea',
    unitPrice: 3_800,
    conditions: [when('facade', 'planken')],
  },
  {
    code: 'facade-fiber',
    name: t('Фиброцементные панели', 'Fibre-cement panels'),
    section: 'facade',
    driver: 'facadeArea',
    unitPrice: 4_600,
    conditions: [when('facade', 'fiber-cement')],
  },
  {
    code: 'deck',
    name: t('Терраса из лиственницы на сваях', 'Larch deck on piles'),
    section: 'terrace',
    driver: 'terraceArea',
    unitPrice: 11_500,
  },
  {
    code: 'delivery',
    name: t('Доставка домокомплекта и бытовка', 'Kit delivery and site cabin'),
    section: 'logistics',
    driver: 'lumpSum',
    unitPrice: 95_000,
  },
  {
    code: 'site-management',
    name: t('Технадзор и уборка площадки', 'Supervision and site cleaning'),
    section: 'logistics',
    driver: 'totalArea',
    unitPrice: 600,
  },
  {
    code: 'electrics',
    name: t('Электрика с щитом и заземлением', 'Wiring, consumer unit and earthing'),
    section: 'engineering',
    driver: 'totalArea',
    unitPrice: 2_600,
    conditions: [when('engineering', 'electrics')],
  },
  {
    code: 'water',
    name: t('Водоснабжение и канализация на точку', 'Water and drainage per wet room'),
    section: 'engineering',
    driver: 'wetZoneCount',
    unitPrice: 115_000,
    conditions: [when('engineering', 'water')],
  },
  {
    code: 'heating',
    name: t('Отопление: котёл и радиаторы', 'Heating: boiler and radiators'),
    section: 'engineering',
    driver: 'totalArea',
    unitPrice: 3_400,
    conditions: [when('engineering', 'heating')],
  },
  {
    code: 'ventilation',
    name: t('Приточно-вытяжная вентиляция с рекуперацией', 'Ventilation with heat recovery'),
    section: 'engineering',
    driver: 'totalArea',
    unitPrice: 1_800,
    conditions: [when('engineering', 'ventilation')],
  },
  {
    code: 'stove',
    name: t('Печь и сэндвич-дымоход', 'Stove and insulated flue'),
    section: 'engineering',
    driver: 'chimneyCount',
    unitPrice: 165_000,
  },
  {
    code: 'finishing',
    name: t('Чистовая отделка стен, полов и потолков', 'Walls, floors and ceilings finishing'),
    section: 'interior',
    driver: 'totalArea',
    unitPrice: 9_500,
  },
  {
    code: 'interior-doors',
    name: t('Межкомнатные двери', 'Interior doors'),
    section: 'interior',
    driver: 'interiorDoorCount',
    unitPrice: 24_000,
  },
]

const SHELL = [
  'foundation',
  'frame',
  'insulation',
  'roof',
  'windows',
  'facade',
  'terrace',
  'logistics',
]

export const COMPLETENESS: ReadonlyArray<{
  key: string
  name: Localized
  sections: readonly string[]
}> = [
  { key: 'shell', name: t('Тёплый контур', 'Weathertight shell'), sections: SHELL },
  {
    key: 'prefinish',
    name: t('Под чистовую', 'Ready for finishing'),
    sections: [...SHELL, 'engineering'],
  },
  {
    key: 'turnkey',
    name: t('Под ключ', 'Turnkey'),
    sections: [...SHELL, 'engineering', 'interior'],
  },
]

export const WORKING_DAYS_PER_WEEK = 5

/** Advertised «price from» is rounded up to whole thousands; estimates stay exact. */
export const ADVERTISED_ROUNDING = { step: 1_000, mode: 'up' } as const

export const PHASES: ReadonlyArray<{ key: string; name: Localized }> = [
  { key: 'production', name: t('Проект и производство', 'Design and production') },
  { key: 'site', name: t('Работы на участке', 'On-site works') },
]

export const STAGES: ReadonlyArray<{
  key: string
  name: Localized
  phase: string
  section?: string
  driver?: QuantityDriver
  baseDays: number
  daysPerUnit: number
  dependsOn: readonly string[]
}> = [
  {
    key: 'contract',
    name: t('Договор и рабочий проект', 'Contract and working drawings'),
    phase: 'production',
    baseDays: 10,
    daysPerUnit: 0,
    dependsOn: [],
  },
  {
    key: 'kit',
    name: t('Производство домокомплекта', 'Kit production'),
    phase: 'production',
    section: 'frame',
    driver: 'totalArea',
    baseDays: 8,
    daysPerUnit: 0.12,
    dependsOn: ['contract'],
  },
  {
    key: 'piles',
    name: t('Свайное поле и обвязка', 'Piles and ring beam'),
    phase: 'site',
    section: 'foundation',
    driver: 'pileCount',
    baseDays: 2,
    daysPerUnit: 0.08,
    dependsOn: ['contract'],
  },
  {
    key: 'assembly',
    name: t('Сборка каркаса', 'Frame assembly'),
    phase: 'site',
    section: 'frame',
    driver: 'totalArea',
    baseDays: 4,
    daysPerUnit: 0.1,
    dependsOn: ['kit', 'piles'],
  },
  {
    key: 'roofing',
    name: t('Кровля', 'Roofing'),
    phase: 'site',
    section: 'roof',
    driver: 'roofArea',
    baseDays: 2,
    daysPerUnit: 0.04,
    dependsOn: ['assembly'],
  },
  {
    key: 'windows',
    name: t('Окна и двери', 'Windows and doors'),
    phase: 'site',
    section: 'windows',
    driver: 'windowCount',
    baseDays: 1,
    daysPerUnit: 0.25,
    dependsOn: ['assembly'],
  },
  {
    key: 'facade',
    name: t('Утепление и фасад', 'Insulation and facade'),
    phase: 'site',
    section: 'facade',
    driver: 'facadeArea',
    baseDays: 2,
    daysPerUnit: 0.06,
    dependsOn: ['roofing', 'windows'],
  },
  {
    key: 'terrace',
    name: t('Терраса', 'Terrace'),
    phase: 'site',
    section: 'terrace',
    driver: 'terraceArea',
    baseDays: 1,
    daysPerUnit: 0.2,
    dependsOn: ['assembly'],
  },
  {
    key: 'engineering',
    name: t('Инженерные системы', 'Building services'),
    phase: 'site',
    section: 'engineering',
    driver: 'totalArea',
    baseDays: 5,
    daysPerUnit: 0.1,
    dependsOn: ['roofing', 'windows'],
  },
  {
    key: 'interior',
    name: t('Внутренняя отделка', 'Interior finishing'),
    phase: 'site',
    section: 'interior',
    driver: 'totalArea',
    baseDays: 8,
    daysPerUnit: 0.18,
    dependsOn: ['engineering'],
  },
  {
    key: 'handover',
    name: t('Сдача дома', 'Handover'),
    phase: 'site',
    baseDays: 2,
    daysPerUnit: 0,
    dependsOn: ['facade', 'terrace', 'interior'],
  },
]
