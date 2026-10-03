export const QUANTITY_UNITS = ['m2', 'm', 'pcs', 'set'] as const
export type QuantityUnit = (typeof QUANTITY_UNITS)[number]

/**
 * Quantity drivers measured for every house. Tariff rates and schedule norms reference these
 * keys; the catalog lists them so content managers can only pick drivers that exist.
 */
export const QUANTITY_DRIVERS = {
  lumpSum: { unit: 'set' },
  totalArea: { unit: 'm2' },
  footprintArea: { unit: 'm2' },
  groundFloorArea: { unit: 'm2' },
  slabArea: { unit: 'm2' },
  ceilingArea: { unit: 'm2' },
  wallArea: { unit: 'm2' },
  facadeArea: { unit: 'm2' },
  roofArea: { unit: 'm2' },
  roofInsulationArea: { unit: 'm2' },
  windowArea: { unit: 'm2' },
  panoramicWindowArea: { unit: 'm2' },
  windowCount: { unit: 'pcs' },
  exteriorDoorCount: { unit: 'pcs' },
  interiorDoorCount: { unit: 'pcs' },
  terraceArea: { unit: 'm2' },
  porchArea: { unit: 'm2' },
  stepCount: { unit: 'pcs' },
  pileCount: { unit: 'pcs' },
  perimeter: { unit: 'm' },
  wetZoneCount: { unit: 'pcs' },
  chimneyCount: { unit: 'pcs' },
} as const satisfies Record<string, { unit: QuantityUnit }>

export type QuantityDriver = keyof typeof QUANTITY_DRIVERS
export const QUANTITY_DRIVER_KEYS = Object.keys(QUANTITY_DRIVERS) as QuantityDriver[]
export type Takeoff = Readonly<Record<QuantityDriver, number>>

export const isQuantityDriver = (value: string): value is QuantityDriver =>
  value in QUANTITY_DRIVERS
