import { HouseError } from '../errors'
import { ROOF_KINDS, isRoofKindKey } from '../roof/kinds'
import type { HouseDesign, OpeningDesign } from './design'
import type { HouseSpec, ResolvedOpening } from './house-spec'
import { isFacadeFinish, isWindowStyle, type HouseOptions, type WindowStyle } from './options'
import { DEFAULT_STANDARDS, type ConstructionStandards } from './standards'
import { validateDesign } from './validate-design'

const HEX_COLOR = /^#[0-9a-f]{6}$/i

function resolveOpening(
  opening: OpeningDesign,
  design: HouseDesign,
  windowStyle: WindowStyle,
  standards: ConstructionStandards,
): ResolvedOpening {
  const panoramic =
    windowStyle === 'panoramic' &&
    opening.type === 'window' &&
    opening.role === 'view' &&
    opening.level < design.storeys
  if (!panoramic) return { ...opening, panoramic: false }
  const sill = standards.panoramicSill
  return {
    ...opening,
    panoramic: true,
    sill,
    width: opening.panoramicWidth ?? opening.width,
    height: design.storeyHeight - standards.panoramicHeadClearance - sill,
  }
}

/**
 * Applies customer options and factory standards to a design. The result is validated and is
 * the only input of the frame, geometry, takeoff and plan builders.
 */
export function resolveHouse(
  design: HouseDesign,
  options: HouseOptions,
  standards: ConstructionStandards = DEFAULT_STANDARDS,
): HouseSpec {
  validateDesign(design)

  if (!isRoofKindKey(options.roofKind)) {
    throw new HouseError('UNKNOWN_OPTION', `Unknown roof kind "${String(options.roofKind)}"`, {
      option: 'roofKind',
    })
  }
  const roofKind = ROOF_KINDS[options.roofKind]
  const roofPitch = options.roofPitch ?? roofKind.pitch.default
  if (roofPitch < roofKind.pitch.min || roofPitch > roofKind.pitch.max) {
    throw new HouseError(
      'UNKNOWN_OPTION',
      `Pitch ${roofPitch}° is outside the ${roofKind.key} range`,
      {
        option: 'roofPitch',
      },
    )
  }
  if (design.attic && !roofKind.supportsAttic) {
    throw new HouseError('UNKNOWN_OPTION', `A ${roofKind.key} roof cannot cover an attic`, {
      option: 'roofKind',
    })
  }
  if (!isFacadeFinish(options.facadeFinish)) {
    throw new HouseError('UNKNOWN_OPTION', 'Unknown facade finish', { option: 'facadeFinish' })
  }
  if (!HEX_COLOR.test(options.facadeColor)) {
    throw new HouseError('UNKNOWN_OPTION', 'Facade colour must be #rrggbb', {
      option: 'facadeColor',
    })
  }
  if (!isWindowStyle(options.windowStyle)) {
    throw new HouseError('UNKNOWN_OPTION', 'Unknown window style', { option: 'windowStyle' })
  }
  if (!Number.isFinite(options.insulation) || options.insulation <= 0) {
    throw new HouseError('INVALID_DIMENSION', 'Insulation must be a positive thickness', {
      option: 'insulation',
    })
  }

  const terrace =
    design.terrace === null || options.terraceDepth === null
      ? null
      : options.terraceDepth === undefined
        ? design.terrace
        : { ...design.terrace, depth: options.terraceDepth }
  if (terrace !== null && !(terrace.depth > 0)) {
    throw new HouseError('INVALID_DIMENSION', 'Terrace depth must be positive', {
      option: 'terraceDepth',
    })
  }

  return {
    width: design.width,
    depth: design.depth,
    storeys: design.storeys,
    attic: design.attic,
    storeyHeight: design.storeyHeight,
    ridgeAxis: design.ridgeAxis,
    roofKind,
    roofPitch,
    facadeFinish: options.facadeFinish,
    facadeColor: options.facadeColor.toLowerCase(),
    windowStyle: options.windowStyle,
    insulation: options.insulation,
    wallThickness: options.insulation + standards.wallSkinThickness,
    kneeWallHeight: roofKind.atticKneeWall ?? standards.kneeWallHeight,
    rooms: design.rooms,
    openings: design.openings.map((opening) =>
      resolveOpening(opening, design, options.windowStyle, standards),
    ),
    doors: design.doors,
    terrace,
    chimney: design.chimney,
    standards,
  }
}
