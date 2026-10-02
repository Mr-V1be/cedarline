import {
  Color,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  type BufferGeometry,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import { SCENE_PALETTE } from './palette'
import { seededRandom, valueNoise } from './random'

/** Shape of a spruce, unit height: many overlapping skirts of needles over a short trunk. */
const TIERS = 11
const RADIAL_SEGMENTS = 14
const TRUNK = { radius: 0.016, height: 0.14 } as const
const CROWN = { base: 0.08, top: 1, widest: 0.2, narrowest: 0.035 } as const
/** Ragged branch tips: radial jitter of each skirt's rim, relative to its radius. */
const RAGGEDNESS = 0.32

function painted(
  geometry: BufferGeometry,
  color: Color,
  random: () => number,
  shading: number,
): BufferGeometry {
  const count = geometry.getAttribute('position').count
  const colors = new Float32Array(count * 3)
  const shade = new Color()
  for (let index = 0; index < count; index += 1) {
    shade.copy(color).multiplyScalar(1 - shading + random() * shading * 2)
    shade.toArray(colors, index * 3)
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  return geometry
}

/** Pushes rim vertices in and out so a skirt reads as branches, not a smooth cone. */
function ragged(cone: BufferGeometry, radius: number, seed: number): BufferGeometry {
  const positions = cone.getAttribute('position')
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index)
    const z = positions.getZ(index)
    const distance = Math.hypot(x, z)
    if (distance < radius * 0.5) continue
    const angle = Math.atan2(z, x)
    const factor = 1 + (valueNoise(angle * 2.2 + seed, seed * 0.7) - 0.5) * 2 * RAGGEDNESS
    positions.setX(index, x * factor)
    positions.setZ(index, z * factor)
    positions.setY(index, positions.getY(index) - (factor - 1) * radius * 0.6)
  }
  cone.computeVertexNormals()
  return cone
}

/**
 * Procedural spruce of unit height. Skirts overlap densely and narrow upwards with a slightly
 * concave profile; ragged rims and shade noise keep the crown from reading as a stack of cones.
 */
export function createConiferGeometry(seed: number): BufferGeometry {
  const random = seededRandom(seed)
  const dark = new Color(SCENE_PALETTE.needlesDark)
  const light = new Color(SCENE_PALETTE.needlesLight)
  const parts: BufferGeometry[] = [
    painted(
      new CylinderGeometry(TRUNK.radius * 0.6, TRUNK.radius, TRUNK.height, 6).translate(
        0,
        TRUNK.height / 2,
        0,
      ),
      new Color(SCENE_PALETTE.trunk),
      random,
      0.1,
    ),
  ]
  const span = CROWN.top - CROWN.base
  const step = span / TIERS
  for (let tier = 0; tier < TIERS; tier += 1) {
    const share = tier / (TIERS - 1)
    const radius = CROWN.narrowest + (CROWN.widest - CROWN.narrowest) * (1 - share) ** 1.25
    const height = step * 2.6
    const bottom = CROWN.base + step * tier * 0.97
    const cone = ragged(
      new ConeGeometry(radius, height, RADIAL_SEGMENTS, 1, true),
      radius,
      seed + tier * 13.7,
    )
    cone.rotateY(random() * Math.PI)
    cone.translate((random() - 0.5) * 0.01, bottom + height / 2, (random() - 0.5) * 0.01)
    parts.push(painted(cone, dark.clone().lerp(light, 0.15 + random() * 0.35), random, 0.18))
  }
  const merged = mergeGeometries(parts)
  parts.forEach((part) => {
    part.dispose()
  })
  return merged
}
