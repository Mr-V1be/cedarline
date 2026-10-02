import type { Vec3 } from '../units'

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const scale = (a: Vec3, factor: number): Vec3 => [
  a[0] * factor,
  a[1] * factor,
  a[2] * factor,
]
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

export function normalize(a: Vec3): Vec3 {
  const length = Math.hypot(a[0], a[1], a[2])
  return length === 0 ? [0, 0, 0] : scale(a, 1 / length)
}

export const UP: Vec3 = [0, 1, 0]

/**
 * Orthonormal frame for planar work: a point at local (a, b, n) is
 * origin + a·aAxis + b·bAxis + n·normal, with normal = aAxis × bAxis.
 */
export interface Basis {
  readonly origin: Vec3
  readonly aAxis: Vec3
  readonly bAxis: Vec3
  readonly normal: Vec3
}

export function basis(origin: Vec3, aAxis: Vec3, bAxis: Vec3): Basis {
  return { origin, aAxis, bAxis, normal: normalize(cross(aAxis, bAxis)) }
}

export function local(frame: Basis, a: number, b: number, n = 0): Vec3 {
  return add(
    add(add(frame.origin, scale(frame.aAxis, a)), scale(frame.bAxis, b)),
    scale(frame.normal, n),
  )
}
