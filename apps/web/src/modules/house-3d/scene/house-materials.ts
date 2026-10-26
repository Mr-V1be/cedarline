import type { FacadeFinish, MaterialSlot } from '@cedarline/house'
import { Color, DoubleSide, MeshStandardMaterial, Vector2, type Material } from 'three'

import { tileSize } from './assets'
import { FINISH_LOOKS, GROUND_TINTS, SCENE_PALETTE } from './palette'
import type { ScenePreset } from './presets'
import type { SceneTextures, TextureSet } from './use-scene-textures'

type MaterialTextures = SceneTextures['materials']

export interface HouseMaterialSettings {
  readonly finish: FacadeFinish
  readonly facadeColor: string
  readonly glow: ScenePreset['windowGlow']
}

const NORMAL_STRENGTH = 1
const SEAM_WIDTH = 0.006
const SEAM_DARKENING = 0.5
const ROOF_ROUGHNESS = 0.62
/**
 * Share of the preset's window glow given to the rooms and to the glass. The glow is in HDR
 * units: lit rooms exceed 1.0, so they are the only surfaces the bloom picks up.
 */
const INTERIOR_GLOW = 1
const GLASS_GLOW = 0.18

/** Full PBR material from a texture set; colourable sets are multiplied by `color`. */
function pbr(
  set: TextureSet,
  color: Color | string,
  extra: Partial<ConstructorParameters<typeof MeshStandardMaterial>[0]> = {},
) {
  return new MeshStandardMaterial({
    color,
    map: set.color,
    normalMap: set.normal,
    normalScale: new Vector2(NORMAL_STRENGTH, NORMAL_STRENGTH),
    roughnessMap: set.arm,
    aoMap: set.arm,
    metalness: 0,
    ...extra,
  })
}

/**
 * Panel joints over a smooth facade (fibre-cement): darkened lines on a metre grid, computed in
 * the shader from the metre-based UVs so they follow every wall exactly.
 */
function withPanelJoints(
  material: MeshStandardMaterial,
  tile: number,
  panel: { width: number; height: number },
) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPanelTile = { value: tile }
    shader.uniforms.uPanelSize = { value: new Vector2(panel.width, panel.height) }
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uPanelTile;\nuniform vec2 uPanelSize;',
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
#ifdef USE_MAP
  vec2 panelMetres = vMapUv * uPanelTile;
  vec2 panelCell = fract(panelMetres / uPanelSize);
  vec2 panelEdge = min(panelCell, 1.0 - panelCell) * uPanelSize;
  float panelSeam = 1.0 - smoothstep(0.0, ${SEAM_WIDTH.toFixed(4)}, min(panelEdge.x, panelEdge.y));
  diffuseColor.rgb *= 1.0 - panelSeam * ${SEAM_DARKENING.toFixed(2)};
#endif`,
      )
  }
  material.customProgramCacheKey = () => `panel-${panel.width}-${panel.height}`
  return material
}

const plain = (color: string, roughness: number, metalness = 0) =>
  new MeshStandardMaterial({ color, roughness, metalness })

/**
 * One material per slot. The registry is exhaustive over the slots the geometry emits, so a
 * new slot cannot be rendered without deciding how it looks.
 */
export function createHouseMaterials(
  textures: MaterialTextures,
  { finish, facadeColor, glow }: HouseMaterialSettings,
): Record<MaterialSlot, Material> {
  const look = FINISH_LOOKS[finish]
  const facadeSet = textures[look.texture]
  const facade = pbr(facadeSet, new Color(facadeColor))
  if (look.panel !== null) withPanelJoints(facade, tileSize(look.texture), look.panel)
  const trimColor = new Color(facadeColor).offsetHSL(0, 0, look.trimShade)
  const emissive =
    glow === null
      ? {}
      : { emissive: new Color(glow.color), emissiveIntensity: glow.intensity * INTERIOR_GLOW }

  return {
    facade,
    trim: pbr(facadeSet, trimColor),
    interior: new MeshStandardMaterial({
      color: SCENE_PALETTE.interior,
      roughness: 0.9,
      ...emissive,
    }),
    floor: pbr(textures.deck, SCENE_PALETTE.plain, emissive),
    // Painted steel: satin finish (no glossy roughness map), a little metal and a dulled sky
    // reflection, so slopes facing the sun stay the colour of the roof instead of turning silver.
    roof: pbr(textures.roofMetal, SCENE_PALETTE.roof, {
      metalness: 0.3,
      roughness: ROOF_ROUGHNESS,
      roughnessMap: null,
      envMapIntensity: 0.55,
    }),
    roofTrim: plain(SCENE_PALETTE.roofTrim, 0.6, 0.3),
    plinth: pbr(textures.concrete, SCENE_PALETTE.plain),
    frame: plain(SCENE_PALETTE.frame, 0.45, 0.2),
    glass: new MeshStandardMaterial({
      color: SCENE_PALETTE.glass,
      roughness: 0.03,
      metalness: 0.25,
      transparent: true,
      opacity: glow === null ? 0.55 : 0.4,
      envMapIntensity: 1.8,
      side: DoubleSide,
      ...(glow === null
        ? {}
        : { emissive: new Color(glow.color), emissiveIntensity: glow.intensity * GLASS_GLOW }),
    }),
    door: pbr(textures.timber, SCENE_PALETTE.door),
    metal: plain(SCENE_PALETTE.metal, 0.35, 0.7),
    deck: pbr(textures.deck, GROUND_TINTS.deck),
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
