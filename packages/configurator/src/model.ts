import type {
  ConstructionStandards,
  FacadeFinish,
  HouseDesign,
  HouseOptions,
  RoofKindKey,
  RoomKindCatalog,
  WindowStyle,
} from '@kedrovnik/house'
import type { Condition, TariffGrid } from '@kedrovnik/pricing'

/** Outer dimensions of the house, mm. */
export interface Footprint {
  readonly width: number
  readonly depth: number
}

export interface FacadeOffer {
  readonly finish: FacadeFinish
  /** Palette of the finish as #rrggbb, in display order. */
  readonly colours: readonly string[]
}

export interface EngineeringOffer {
  readonly key: string
  /** Systems that must be selected for this one to work (отопление требует электрики). */
  readonly requires: readonly string[]
}

export interface TerraceOffer {
  /** Offered terrace depths, mm; the project's own depth is always offered as well. */
  readonly depths: readonly number[]
  /** Whether the customer may drop the terrace altogether. */
  readonly removable: boolean
}

/**
 * A combination of choices that the factory does not build. The rule is broken when every
 * condition holds; its explanation is content and lives with the rule in the catalog.
 */
export interface CompatibilityRule {
  readonly id: string
  readonly when: readonly Condition[]
}

/** Everything the catalog offers to customers. Pure data, edited in the CMS. */
export interface ConfiguratorOffer {
  readonly roofs: readonly RoofKindKey[]
  readonly facades: readonly FacadeOffer[]
  readonly windowStyles: readonly WindowStyle[]
  readonly terrace: TerraceOffer
  readonly insulation: readonly number[]
  readonly engineering: readonly EngineeringOffer[]
  readonly rules: readonly CompatibilityRule[]
}

export interface ProjectDefaults {
  readonly options: HouseOptions
  readonly engineering: readonly string[]
}

/** A catalog project as the configurator sees it: its design and what may vary. */
export interface ProjectBlueprint {
  readonly slug: string
  readonly design: HouseDesign
  readonly defaults: ProjectDefaults
  /** Footprints offered besides the design's own. */
  readonly sizes: readonly Footprint[]
  /** Whether the mirrored plan is offered. */
  readonly mirrorable: boolean
}

export interface HouseContext {
  readonly rooms: RoomKindCatalog
  readonly standards: ConstructionStandards
}

/**
 * Input of the configurator. `family` holds the storey variants of one project (одноэтажный,
 * с мансардой, двухэтажный); a project without variants is a family of one.
 */
export interface ConfiguratorModel {
  readonly family: readonly ProjectBlueprint[]
  readonly offer: ConfiguratorOffer
  readonly house: HouseContext
  readonly grid: TariffGrid
}
