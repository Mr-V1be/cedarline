import { Color, MeshStandardMaterial, Vector2 } from 'three'

import type { TextureSet } from '../use-scene-textures'

export interface GroundSettings {
  readonly lawn: TextureSet
  readonly forestFloor: TextureSet
  readonly lawnTint: string
  readonly forestTint: string
  /** Repeat of the forest floor texture per metre. */
  readonly forestRepeat: number
  /** Distance from the house over which the lawn gives way to the forest floor, metres. */
  readonly forestEdge: readonly [number, number]
}

const NOISE = /* glsl */ `
float groundHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float groundNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(groundHash(i), groundHash(i + vec2(1.0, 0.0)), u.x),
             mix(groundHash(i + vec2(0.0, 1.0)), groundHash(i + vec2(1.0, 1.0)), u.x), u.y);
}
`

const FRAGMENT_DECLARATIONS = /* glsl */ `
uniform sampler2D uForestColor;
uniform vec3 uForestTint;
uniform float uForestRepeat;
uniform vec2 uForestEdge;
uniform vec2 uLawnRepeat;
varying vec3 vGroundWorld;
${NOISE}
`

/**
 * Breaks the lawn's repetition and flatness: a second, rotated sample of the grass blended by
 * noise, large dry and lush patches, then a frayed transition to needle litter under the forest.
 */
const FRAGMENT_SURFACE = /* glsl */ `
#include <map_fragment>
vec2 groundPoint = vGroundWorld.xz;
// A second, rotated and larger sample of the grass hides the tile; a very large one gives the
// clumps and worn patches a lawn has when seen from a few dozen metres.
vec2 rotated = mat2(0.8, 0.6, -0.6, 0.8) * groundPoint * uLawnRepeat * 0.41 + 0.17;
vec3 lawnSecond = diffuse * texture2D(map, rotated).rgb;
diffuseColor.rgb = mix(diffuseColor.rgb, lawnSecond, 0.55 * groundNoise(groundPoint * 0.09));
float clumps = dot(texture2D(map, groundPoint * uLawnRepeat * 0.12).rgb, vec3(0.333));
diffuseColor.rgb *= 0.62 + clumps * 0.85;
float dryness = smoothstep(0.3, 0.85, groundNoise(groundPoint * 0.045 + 3.1));
float lushness = smoothstep(0.4, 0.9, groundNoise(groundPoint * 0.13 - 5.7));
diffuseColor.rgb *= mix(vec3(1.0), vec3(1.3, 1.15, 0.7), dryness * 0.8);
diffuseColor.rgb *= mix(vec3(1.0), vec3(0.72, 0.86, 0.7), lushness * 0.7);
diffuseColor.rgb *= 0.82 + 0.36 * groundNoise(groundPoint * 0.7);
float frayed = length(groundPoint) + (groundNoise(groundPoint * 0.07) - 0.5) * (uForestEdge.y - uForestEdge.x);
float forest = smoothstep(uForestEdge.x, uForestEdge.y, frayed);
vec3 litter = uForestTint * texture2D(uForestColor, groundPoint * uForestRepeat).rgb;
diffuseColor.rgb = mix(diffuseColor.rgb, litter, forest);
`

/** The plot's ground: lawn near the house fraying into forest floor, lit like everything else. */
export function createGroundMaterial(settings: GroundSettings): MeshStandardMaterial {
  const { lawn, forestFloor } = settings
  const material = new MeshStandardMaterial({
    color: settings.lawnTint,
    map: lawn.color,
    normalMap: lawn.normal,
    roughnessMap: lawn.arm,
    aoMap: lawn.arm,
  })
  const lawnRepeat = new Vector2().copy(lawn.color.repeat)
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uForestColor = { value: forestFloor.color }
    shader.uniforms.uForestTint = { value: new Color(settings.forestTint) }
    shader.uniforms.uForestRepeat = { value: settings.forestRepeat }
    shader.uniforms.uForestEdge = { value: new Vector2(...settings.forestEdge) }
    shader.uniforms.uLawnRepeat = { value: lawnRepeat }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vGroundWorld;')
      .replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\nvGroundWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAGMENT_DECLARATIONS}`)
      .replace('#include <map_fragment>', FRAGMENT_SURFACE)
  }
  material.customProgramCacheKey = () => 'site-ground'
  return material
}
