/**
 * Construction standards of the factory: dimensions that are the same for every project.
 * The application may override them from CMS data (for example the wall skin is the sum of
 * the wall assembly layers except insulation), so they are passed in rather than imported.
 */
export interface ConstructionStandards {
  /** Finished ground floor above grade (screw piles + strapping beam). */
  readonly plinthHeight: number
  /** Floor structure between two storeys. */
  readonly slabThickness: number
  /** Ceiling structure above the top storey when there is no attic. */
  readonly ceilingThickness: number
  /** Attic knee wall above the attic floor. */
  readonly kneeWallHeight: number
  /** Every exterior wall layer except insulation (linings, membranes, battens, cladding). */
  readonly wallSkinThickness: number
  readonly partitionThickness: number
  readonly eaveOverhang: number
  readonly gableOverhang: number
  /** Visible thickness of the roof build-up at fascias and barge boards. */
  readonly roofThickness: number
  readonly windowFrameWidth: number
  readonly windowFrameDepth: number
  /** Distance from the facade plane to the outer face of window frames. */
  readonly windowRecess: number
  /** Panes wider than this are split by mullions. */
  readonly maxPaneWidth: number
  readonly panoramicSill: number
  /** Gap between the top of panoramic glazing and the ceiling. */
  readonly panoramicHeadClearance: number
  /** The deck sits this much below the finished ground floor. */
  readonly deckDrop: number
  readonly pileSpacing: number
  readonly chimneyClearance: number
  readonly chimneyDiameter: number
  readonly cornerBoardWidth: number
  readonly cornerBoardThickness: number
}

export const DEFAULT_STANDARDS: ConstructionStandards = {
  plinthHeight: 600,
  slabThickness: 300,
  ceilingThickness: 250,
  kneeWallHeight: 1200,
  wallSkinThickness: 95,
  partitionThickness: 100,
  eaveOverhang: 500,
  gableOverhang: 400,
  roofThickness: 220,
  windowFrameWidth: 70,
  windowFrameDepth: 70,
  windowRecess: 60,
  maxPaneWidth: 1400,
  panoramicSill: 100,
  panoramicHeadClearance: 250,
  deckDrop: 150,
  pileSpacing: 2000,
  chimneyClearance: 700,
  chimneyDiameter: 220,
  cornerBoardWidth: 110,
  cornerBoardThickness: 30,
}
