import { deriveFrame } from './frame/derive'
import type { HouseFrame } from './frame/types'
import { buildHouseModel, type HouseModel } from './geometry/model'
import { buildFloorPlans } from './plan/plan'
import type { FloorPlan } from './plan/types'
import type { HouseDesign } from './spec/design'
import type { HouseOptions } from './spec/options'
import { resolveHouse } from './spec/resolve'
import type { RoomKindCatalog } from './spec/room-traits'
import type { ConstructionStandards } from './spec/standards'
import type { Takeoff } from './takeoff/drivers'
import { computeMetrics, type HouseMetrics } from './takeoff/metrics'
import { computeTakeoff } from './takeoff/takeoff'

export interface HouseInput {
  readonly design: HouseDesign
  readonly options: HouseOptions
  readonly rooms: RoomKindCatalog
  readonly standards?: ConstructionStandards
}

/** Measured house: the frame plus everything that is cheap to derive eagerly. */
export interface MeasuredHouse {
  readonly frame: HouseFrame
  readonly takeoff: Takeoff
  readonly metrics: HouseMetrics
}

/** Resolves, validates and measures a house. Mesh and plans are built on demand. */
export function measureHouse(input: HouseInput): MeasuredHouse {
  const frame = deriveFrame(resolveHouse(input.design, input.options, input.standards))
  const takeoff = computeTakeoff(frame, input.rooms)
  return { frame, takeoff, metrics: computeMetrics(frame, takeoff, input.rooms) }
}

export const houseModel = (house: MeasuredHouse): HouseModel => buildHouseModel(house.frame)

export const housePlans = (house: MeasuredHouse, rooms: RoomKindCatalog): FloorPlan[] =>
  buildFloorPlans(house.frame, rooms)
