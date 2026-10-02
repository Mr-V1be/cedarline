/**
 * Exterior wall assembly (разрез стены), ordered from the outside in. It is catalog data: the
 * same layers draw the section on the site and give the wall thickness used by the geometry.
 */
export const LAYER_ROLES = [
  'cladding',
  'air-gap',
  'membrane',
  'insulation',
  'batten',
  'lining',
] as const
export type LayerRole = (typeof LAYER_ROLES)[number]

export interface WallLayer {
  readonly key: string
  readonly role: LayerRole
  /** mm; the insulation layer takes the selected insulation thickness instead. */
  readonly thickness: number
  /** W/(m·°C); layers outside the ventilated gap or without data do not count thermally. */
  readonly conductivity: number | null
}

export interface ResolvedLayer extends WallLayer {
  readonly thermalResistance: number | null
}

export interface ResolvedWall {
  readonly layers: readonly ResolvedLayer[]
  readonly insulation: number
  readonly totalThickness: number
  /** Everything but insulation: what the factory adds around the insulated frame. */
  readonly skinThickness: number
  /** Total thermal resistance including surface resistances, m²·°C/W. */
  readonly thermalResistance: number
}

/**
 * Surface heat transfer of walls per SP 50.13330: 8.7 W/(m²·°C) inside, 12 W/(m²·°C) outside
 * for a wall behind a ventilated facade.
 */
const INNER_SURFACE_RESISTANCE = 1 / 8.7
const OUTER_SURFACE_RESISTANCE = 1 / 12
const MM_PER_M = 1000
const RESISTANCE_DECIMALS = 100

export class WallAssemblyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WallAssemblyError'
  }
}

export function resolveWall(layers: readonly WallLayer[], insulation: number): ResolvedWall {
  const insulationLayers = layers.filter((layer) => layer.role === 'insulation')
  if (insulationLayers.length !== 1) {
    throw new WallAssemblyError('A wall assembly needs exactly one insulation layer')
  }
  const resolved = layers.map((layer): ResolvedLayer => {
    const thickness = layer.role === 'insulation' ? insulation : layer.thickness
    return {
      ...layer,
      thickness,
      thermalResistance:
        layer.conductivity === null ? null : thickness / MM_PER_M / layer.conductivity,
    }
  })
  const totalThickness = resolved.reduce((sum, layer) => sum + layer.thickness, 0)
  const layerResistance = resolved.reduce((sum, layer) => sum + (layer.thermalResistance ?? 0), 0)
  const thermalResistance = INNER_SURFACE_RESISTANCE + layerResistance + OUTER_SURFACE_RESISTANCE
  return {
    layers: resolved,
    insulation,
    totalThickness,
    skinThickness: totalThickness - insulation,
    thermalResistance: Math.round(thermalResistance * RESISTANCE_DECIMALS) / RESISTANCE_DECIMALS,
  }
}
