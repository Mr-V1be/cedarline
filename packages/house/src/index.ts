export { HouseError, type HouseErrorCode } from './errors'
export { MM_PER_METRE, toMetres, roundTo, type Vec2, type Vec3 } from './units'

export {
  WALL_SIDES,
  OPENING_TYPES,
  WINDOW_ROLES,
  RIDGE_AXES,
  DOOR_ORIENTATIONS,
  type WallSide,
  type OpeningType,
  type WindowRole,
  type RidgeAxis,
  type DoorOrientation,
  type HouseDesign,
  type RoomDesign,
  type OpeningDesign,
  type InteriorDoorDesign,
  type TerraceDesign,
  type ChimneyDesign,
} from './spec/design'
export {
  FACADE_FINISHES,
  WINDOW_STYLES,
  isFacadeFinish,
  isWindowStyle,
  type FacadeFinish,
  type WindowStyle,
  type HouseOptions,
} from './spec/options'
export { DEFAULT_STANDARDS, type ConstructionStandards } from './spec/standards'
export { traitsOf, type RoomKindCatalog, type RoomKindTraits } from './spec/room-traits'
export { levelCount, type HouseSpec, type ResolvedOpening } from './spec/house-spec'
export { resolveHouse } from './spec/resolve'
export { validateDesign, MAX_STOREYS } from './spec/validate-design'

export {
  ROOF_KINDS,
  ROOF_KIND_KEYS,
  isRoofKindKey,
  type RoofKind,
  type RoofKindKey,
  type PitchRange,
} from './roof/kinds'

export { deriveFrame } from './frame/derive'
export type {
  HouseFrame,
  WallFrame,
  RoofFrame,
  LevelFrame,
  OpeningFrame,
  TerraceFrame,
} from './frame/types'

export { MATERIAL_SLOTS, type MaterialSlot } from './geometry/slots'
export type { MeshPart } from './geometry/mesh-builder'
export { buildHouseModel, type HouseModel, type Bounds } from './geometry/model'

export {
  QUANTITY_DRIVERS,
  QUANTITY_DRIVER_KEYS,
  QUANTITY_UNITS,
  isQuantityDriver,
  type QuantityDriver,
  type QuantityUnit,
  type Takeoff,
} from './takeoff/drivers'
export { computeTakeoff } from './takeoff/takeoff'
export { computeMetrics, type HouseMetrics } from './takeoff/metrics'

export { buildFloorPlans } from './plan/plan'
export { DIMENSION_SIDES } from './plan/types'
export type {
  FloorPlan,
  PlanRoom,
  PlanOpening,
  PlanDoor,
  PlanRect,
  DimensionChain,
  DimensionSide,
} from './plan/types'

export { measureHouse, houseModel, housePlans, type HouseInput, type MeasuredHouse } from './house'
