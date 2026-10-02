import type { FacadeFinish, MaterialSlot } from '@kedrovnik/house'
import { Color, DoubleSide, MeshStandardMaterial, type Material } from 'three'

import { SCENE_PALETTE, TRIM_SHADE } from './scene-palette'
import { deckPattern, facadePattern, roofPattern, type Pattern } from './textures'

export interface MaterialSettings {
  readonly finish: FacadeFinish
  readonly facadeColor: string
}

const BUMP_SCALE = 0.6

function textured(
  color: Color | string,
  pattern: Pattern,
  roughness: number,
  metalness = 0,
): MeshStandardMaterial {
  pattern.map.repeat.set(1 / pattern.tile[0], 1 / pattern.tile[1])
  pattern.bump.repeat.set(1 / pattern.tile[0], 1 / pattern.tile[1])
  return new MeshStandardMaterial({
    color,
    map: pattern.map,
    bumpMap: pattern.bump,
    bumpScale: BUMP_SCALE,
    roughness,
    metalness,
  })
}

const plain = (color: string, roughness: number, metalness = 0) =>
  new MeshStandardMaterial({ color, roughness, metalness })

/**
 * One material per slot. The registry is exhaustive over the slots the geometry emits, so a
 * new slot cannot be rendered without deciding how it looks.
 */
export function createMaterials({
  finish,
  facadeColor,
}: MaterialSettings): Record<MaterialSlot, Material> {
  const facade = new Color(facadeColor)
  const trim = facade.clone().offsetHSL(0, 0, TRIM_SHADE[finish])
  return {
    facade: textured(facade, facadePattern(finish), finish === 'fiber-cement' ? 0.75 : 0.85),
    trim: new MeshStandardMaterial({ color: trim, roughness: 0.8 }),
    interior: plain(SCENE_PALETTE.interior, 0.9),
    floor: plain(SCENE_PALETTE.floor, 0.75),
    roof: textured(SCENE_PALETTE.roof, roofPattern(), 0.55, 0.35),
    roofTrim: plain(SCENE_PALETTE.roofTrim, 0.7, 0.2),
    plinth: plain(SCENE_PALETTE.plinth, 0.95),
    frame: plain(SCENE_PALETTE.frame, 0.5, 0.1),
    glass: new MeshStandardMaterial({
      color: SCENE_PALETTE.glass,
      roughness: 0.04,
      metalness: 0.2,
      transparent: true,
      opacity: 0.6,
      envMapIntensity: 1.6,
      side: DoubleSide,
    }),
    door: plain(SCENE_PALETTE.door, 0.6),
    metal: plain(SCENE_PALETTE.metal, 0.4, 0.65),
    deck: textured(SCENE_PALETTE.deck, deckPattern(), 0.85),
  }
}

/** Slots that throw shadows; glass and the interior only receive them. */
export const SHADOW_CASTERS: ReadonlySet<MaterialSlot> = new Set<MaterialSlot>([
  'facade',
  'trim',
  'roof',
  'roofTrim',
  'plinth',
  'frame',
  'door',
  'metal',
  'deck',
])
