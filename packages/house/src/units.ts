/** Design data is authored in whole millimetres; 3D geometry is emitted in metres. */
export const MM_PER_METRE = 1000
export const MM2_PER_M2 = MM_PER_METRE * MM_PER_METRE

export const toMetres = (millimetres: number): number => millimetres / MM_PER_METRE
export const toSquareMetres = (squareMillimetres: number): number => squareMillimetres / MM2_PER_M2

export type Vec2 = readonly [number, number]
export type Vec3 = readonly [number, number, number]

export const degreesToRadians = (degrees: number): number => (degrees * Math.PI) / 180

/** Rounds to a fixed number of decimals without float noise (12.345 → 12.35 at 2). */
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}
