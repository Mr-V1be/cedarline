import { profileHeightAt, profileRidgeHeight, type RoofProfile } from '../roof/profile'
import { WALL_SIDES, type WallSide } from '../spec/design'
import type { HouseSpec } from '../spec/house-spec'
import type { Vec2 } from '../units'
import { planPointOnWall, roofLength, roofSpan, spanCoordinate, wallPlacement } from './placement'
import type {
  ChimneyFrame,
  HouseFrame,
  LevelFrame,
  OpeningFrame,
  RoofFrame,
  WallFrame,
} from './types'
import { assertEntrances } from './entrance-rules'
import { deriveLandings } from './landings'
import { validateOpenings } from './validate-openings'

function storeyLevels(spec: HouseSpec): LevelFrame[] {
  const { plinthHeight, slabThickness } = spec.standards
  return Array.from({ length: spec.storeys }, (_, index) => {
    const floor = plinthHeight + index * (spec.storeyHeight + slabThickness)
    return { index, attic: false, floor, ceiling: floor + spec.storeyHeight }
  })
}

function roofFrame(spec: HouseSpec, eaveBase: number): RoofFrame {
  const span = roofSpan(spec)
  const profile = spec.roofKind.profile(span, spec.roofPitch)
  return {
    kind: spec.roofKind,
    pitch: spec.roofPitch,
    ridgeAxis: spec.ridgeAxis,
    span,
    length: roofLength(spec),
    profile,
    eaveBase,
    ridgeElevation: eaveBase + profileRidgeHeight(profile),
    eaveOverhang: spec.standards.eaveOverhang,
    gableOverhang: spec.standards.gableOverhang,
    thickness: spec.standards.roofThickness,
  }
}

/**
 * Outline of a wall's outer face. Along a gable the top follows the roof profile, so the
 * profile break points become polygon vertices; any other wall is a rectangle whose top is
 * the profile height at its span position (tall wall of a shed roof).
 */
function wallOutline(
  spec: HouseSpec,
  side: WallSide,
  roof: RoofFrame,
): Pick<WallFrame, 'polygon' | 'gable'> & ReturnType<typeof wallPlacement> {
  const placement = wallPlacement(spec, side)
  const { length } = placement
  const s0 = spanCoordinate(roof.ridgeAxis, planPointOnWall(placement, 0))
  const s1 = spanCoordinate(roof.ridgeAxis, planPointOnWall(placement, length))
  const rate = (s1 - s0) / length
  const gable = rate !== 0
  const profile: RoofProfile = roof.profile
  const topAt = (u: number) => roof.eaveBase + profileHeightAt(profile, s0 + rate * u)

  const breaks = gable
    ? profile.points.map(([s]) => (s - s0) / rate).filter((u) => u > 0 && u < length)
    : []
  const topUs = [length, ...breaks.sort((left, right) => right - left), 0]
  const bottom = spec.standards.plinthHeight
  const polygon: Vec2[] = [[0, bottom], [length, bottom], ...topUs.map((u): Vec2 => [u, topAt(u)])]
  return { ...placement, polygon, gable }
}

function chimneyFrame(spec: HouseSpec, roof: RoofFrame): ChimneyFrame | null {
  if (spec.chimney === null) return null
  const { x, y } = spec.chimney
  const roofTop =
    roof.eaveBase + profileHeightAt(roof.profile, spanCoordinate(roof.ridgeAxis, [x, y]))
  return {
    x,
    y,
    base: roof.eaveBase,
    top: roofTop + roof.thickness + spec.standards.chimneyClearance,
    diameter: spec.standards.chimneyDiameter,
  }
}

/** Derives every analytic shape of the house from its spec. */
export function deriveFrame(spec: HouseSpec): HouseFrame {
  const storeys = storeyLevels(spec)
  const topStorey = storeys[storeys.length - 1]
  const topCeiling = topStorey?.ceiling ?? spec.standards.plinthHeight
  const atticFloor = topCeiling + spec.standards.slabThickness
  const eaveBase = spec.attic
    ? atticFloor + spec.kneeWallHeight
    : topCeiling + spec.standards.ceilingThickness
  const roof = roofFrame(spec, eaveBase)

  const levels: LevelFrame[] = spec.attic
    ? [
        ...storeys,
        { index: spec.storeys, attic: true, floor: atticFloor, ceiling: roof.ridgeElevation },
      ]
    : storeys

  const walls: WallFrame[] = WALL_SIDES.map((side) => {
    const outline = wallOutline(spec, side, roof)
    const openings: OpeningFrame[] = spec.openings
      .filter((opening) => opening.side === side)
      .map((opening) => {
        const floor = levels[opening.level]?.floor ?? spec.standards.plinthHeight
        const v0 = floor + opening.sill
        return {
          opening,
          u0: opening.offset,
          u1: opening.offset + opening.width,
          v0,
          v1: v0 + opening.height,
        }
      })
    return { ...outline, openings }
  })
  validateOpenings(walls, levels)

  return assertEntrances({
    spec,
    levels,
    walls,
    roof,
    landings: deriveLandings(spec, walls, levels[0]?.floor ?? spec.standards.plinthHeight),
    chimney: chimneyFrame(spec, roof),
  })
}
