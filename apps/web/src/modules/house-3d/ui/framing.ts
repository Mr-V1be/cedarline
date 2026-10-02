import type { Bounds } from '@kedrovnik/house'

import { CAMERA_PRESETS, type CameraPreset } from '../domain/camera-presets'

const DEG = Math.PI / 180
/** Share of the frame the house may fill, leaving a margin on the tightest side. */
const FILL = 0.86

type Vector = readonly [number, number, number]

export interface Framing {
  readonly target: Vector
  /** Half of the bounding-box diagonal: a scale for zoom limits. */
  readonly radius: number
}

export function frameModel(bounds: Bounds): Framing {
  const [minX, minY, minZ] = bounds.min
  const [maxX, maxY, maxZ] = bounds.max
  return {
    target: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
    radius: Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2,
  }
}

function direction(preset: CameraPreset): Vector {
  const { azimuth, elevation } = CAMERA_PRESETS[preset]
  const a = azimuth * DEG
  const e = elevation * DEG
  return [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)]
}

/**
 * Smallest camera distance at which every corner of the bounding box is inside the frame
 * for this preset and aspect ratio: the house fills the frame from any angle.
 */
export function fitDistance(
  bounds: Bounds,
  framing: Framing,
  preset: CameraPreset,
  verticalFov: number,
  aspect: number,
): number {
  const back = direction(preset)
  const forward: Vector = [-back[0], -back[1], -back[2]]
  const rightRaw: Vector = [-forward[2], 0, forward[0]]
  const rightLength = Math.hypot(rightRaw[0], rightRaw[2]) || 1
  const right: Vector = [rightRaw[0] / rightLength, 0, rightRaw[2] / rightLength]
  const up: Vector = [
    right[1] * forward[2] - right[2] * forward[1],
    right[2] * forward[0] - right[0] * forward[2],
    right[0] * forward[1] - right[1] * forward[0],
  ]
  const tanV = Math.tan((verticalFov * DEG) / 2) * FILL
  const tanH = tanV * aspect
  let distance = 0
  for (const x of [bounds.min[0], bounds.max[0]]) {
    for (const y of [bounds.min[1], bounds.max[1]]) {
      for (const z of [bounds.min[2], bounds.max[2]]) {
        const offset: Vector = [x - framing.target[0], y - framing.target[1], z - framing.target[2]]
        const dot = (axis: Vector) =>
          offset[0] * axis[0] + offset[1] * axis[1] + offset[2] * axis[2]
        const depth = dot(forward)
        distance = Math.max(
          distance,
          depth + Math.abs(dot(right)) / tanH,
          depth + Math.abs(dot(up)) / tanV,
        )
      }
    }
  }
  return distance
}

/** Camera position for a preset at a distance from the framed target. */
export function presetPosition(
  framing: Framing,
  preset: CameraPreset,
  distance: number,
): [number, number, number] {
  const [dx, dy, dz] = direction(preset)
  const [x, y, z] = framing.target
  return [x + dx * distance, y + dy * distance, z + dz * distance]
}
