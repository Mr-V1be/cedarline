import {
  MeshDepthMaterial,
  MeshStandardMaterial,
  type Texture,
  type WebGLProgramParametersWithUniforms,
} from 'three'

import type { TreeDimensions } from '../assets'

export interface ImpostorSettings {
  readonly albedo: Texture
  readonly normal: Texture
  readonly grid: number
  readonly dimensions: TreeDimensions
}

const VERTEX_DECLARATIONS = /* glsl */ `
uniform float uImpostorGrid;
uniform float uImpostorCentreY;
uniform float uImpostorRadius;
varying vec2 vImpostorUv;
varying vec2 vImpostorCell;
varying vec2 vImpostorBlend;
varying vec3 vImpostorX;
varying vec3 vImpostorY;
varying vec3 vImpostorZ;
`

/**
 * Turns the unit quad into a billboard around the tree and picks the baked views closest to
 * the direction it is seen from (hemi-octahedral grid, as in the bake). Works for any camera,
 * so the trees would also face a shadow camera.
 */
const VERTEX_BILLBOARD = /* glsl */ `
float impostorScale = length(instanceMatrix[0].xyz);
mat3 impostorRotation = mat3(instanceMatrix) / impostorScale;
vec3 impostorCentre = instanceMatrix[3].xyz + vec3(0.0, uImpostorCentreY * impostorScale, 0.0);
vec3 impostorView = normalize(transpose(impostorRotation) * (cameraPosition - impostorCentre));
impostorView.y = max(impostorView.y, 0.0);
vec3 impostorAbs = abs(impostorView);
vec2 impostorPlane = impostorView.xz / (impostorAbs.x + impostorAbs.y + impostorAbs.z + 1e-5);
vec2 impostorOct = vec2(impostorPlane.x + impostorPlane.y, impostorPlane.x - impostorPlane.y);
vec2 impostorGrid = (impostorOct * 0.5 + 0.5) * (uImpostorGrid - 1.0);
vImpostorCell = min(floor(impostorGrid), vec2(uImpostorGrid - 2.0));
// Sharpened blend: one view most of the time, a short cross-fade between neighbours.
vImpostorBlend = smoothstep(0.25, 0.75, impostorGrid - vImpostorCell);
vImpostorUv = uv;
vec3 impostorRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
vec3 impostorUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
vec3 impostorWorld = impostorCentre
  + (impostorRight * position.x + impostorUp * position.y) * (2.0 * uImpostorRadius * impostorScale);
mat3 impostorToView = mat3(viewMatrix) * impostorRotation;
vImpostorX = impostorToView[0];
vImpostorY = impostorToView[1];
vImpostorZ = impostorToView[2];
vec3 transformed = impostorWorld;
`

const FRAGMENT_DECLARATIONS = /* glsl */ `
uniform sampler2D uImpostorAlbedo;
uniform sampler2D uImpostorNormal;
uniform float uImpostorGrid;
varying vec2 vImpostorUv;
varying vec2 vImpostorCell;
varying vec2 vImpostorBlend;
varying vec3 vImpostorX;
varying vec3 vImpostorY;
varying vec3 vImpostorZ;

// Atlas rows run top to bottom like the baked image; quad v runs bottom to top.
vec4 impostorSample(sampler2D atlas, vec2 cell) {
  return texture2D(atlas, (cell + vec2(vImpostorUv.x, 1.0 - vImpostorUv.y)) / uImpostorGrid);
}

vec4 impostorBlend(sampler2D atlas) {
  vec2 f = vImpostorBlend;
  return impostorSample(atlas, vImpostorCell) * (1.0 - f.x) * (1.0 - f.y)
    + impostorSample(atlas, vImpostorCell + vec2(1.0, 0.0)) * f.x * (1.0 - f.y)
    + impostorSample(atlas, vImpostorCell + vec2(0.0, 1.0)) * (1.0 - f.x) * f.y
    + impostorSample(atlas, vImpostorCell + vec2(1.0, 1.0)) * f.x * f.y;
}
`

const FRAGMENT_ALBEDO = /* glsl */ `
vec4 impostorAlbedo = impostorBlend(uImpostorAlbedo);
if (impostorAlbedo.a < 0.5) discard;
diffuseColor.rgb *= impostorAlbedo.rgb;
`

const FRAGMENT_CUTOUT = /* glsl */ `
if (impostorBlend(uImpostorAlbedo).a < 0.5) discard;
`

const FRAGMENT_NORMAL = /* glsl */ `
float faceDirection = 1.0;
vec3 impostorLocal = normalize(impostorBlend(uImpostorNormal).xyz * 2.0 - 1.0);
vec3 normal = normalize(mat3(vImpostorX, vImpostorY, vImpostorZ) * impostorLocal);
vec3 nonPerturbedNormal = normal;
`

function billboard(shader: WebGLProgramParametersWithUniforms, settings: ImpostorSettings) {
  shader.uniforms.uImpostorGrid = { value: settings.grid }
  shader.uniforms.uImpostorCentreY = { value: settings.dimensions.centreY }
  shader.uniforms.uImpostorRadius = { value: settings.dimensions.radius }
  shader.uniforms.uImpostorAlbedo = { value: settings.albedo }
  shader.uniforms.uImpostorNormal = { value: settings.normal }
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${VERTEX_DECLARATIONS}`)
    .replace('#include <begin_vertex>', VERTEX_BILLBOARD)
    .replace(
      '#include <project_vertex>',
      'vec4 mvPosition = viewMatrix * vec4(transformed, 1.0);\ngl_Position = projectionMatrix * mvPosition;',
    )
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <common>',
    `#include <common>\n${FRAGMENT_DECLARATIONS}`,
  )
}

export interface ImpostorMaterials {
  /** Lit and fogged like the house next to it. */
  readonly surface: MeshStandardMaterial
  /**
   * Shadow pass: the quad turns to the sun and cuts out the tree as the sun sees it, so the
   * forest throws dappled, tree-shaped shadows.
   */
  readonly depth: MeshDepthMaterial
}

/**
 * Materials of instanced tree impostors: albedo and normals come from atlases of a
 * photoscanned tree baked from a grid of directions, so a single quad per tree is lit by the
 * scene's sun and sky like the house next to it.
 */
export function createImpostorMaterials(settings: ImpostorSettings): ImpostorMaterials {
  const surface = new MeshStandardMaterial({ roughness: 0.92, metalness: 0 })
  surface.onBeforeCompile = (shader) => {
    billboard(shader, settings)
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      'vec4 worldPosition = vec4(transformed, 1.0);',
    )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <map_fragment>', FRAGMENT_ALBEDO)
      .replace('#include <normal_fragment_begin>', FRAGMENT_NORMAL)
  }
  surface.customProgramCacheKey = () => 'tree-impostor'

  const depth = new MeshDepthMaterial()
  depth.onBeforeCompile = (shader) => {
    billboard(shader, settings)
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      FRAGMENT_CUTOUT,
    )
  }
  depth.customProgramCacheKey = () => 'tree-impostor-depth'
  return { surface, depth }
}
