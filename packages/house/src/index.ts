export { HouseError, type HouseErrorCode } from './errors'
export { MM_PER_METRE, toMetres, roundTo, type Rect, type Vec2, type Vec3 } from './units'

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
  TERRACE_REACHES,
  type TerraceReach,
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
export { resizeDesign, mirrorDesign } from './spec/transform'
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
export {
  LANDING_KINDS,
  terraceOf,
  type HouseFrame,
  type WallFrame,
  type RoofFrame,
  type LevelFrame,
  type OpeningFrame,
  type LandingFrame,
  type LandingKind,
  type StairFrame,
} from './frame/types'
export {
  ENTRANCE_RULES,
  MAX_THRESHOLD_STEP,
  entranceViolations,
  type EntranceRule,
  type EntranceViolation,
} from './frame/entrance-rules'
export { entrancesOf, type Entrance } from './frame/landings'

export { MATERIAL_SLOTS, type MaterialSlot } from './geometry/slots'
export type { MeshPart } from './geometry/mesh-builder'
export { buildHouseModel, type HouseModel, type Bounds } from './geometry/model'
export type { Approach, GroundLanding, GroundRect, SiteAnchors } from './geometry/anchors'

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
  PlanDeck,
  DimensionChain,
  DimensionSide,
} from './plan/types'

export { measureHouse, houseModel, housePlans, type HouseInput, type MeasuredHouse } from './house'
