/**
 * Material slots of the house mesh. Geometry only says which surface is which; the renderer
 * owns the look of every slot. UVs are in metres so textures tile at real-world scale.
 */
export const MATERIAL_SLOTS = [
  'facade',
  'trim',
  'interior',
  'floor',
  'roof',
  'roofTrim',
  'plinth',
  'frame',
  'glass',
  'door',
  'metal',
  'deck',
] as const

export type MaterialSlot = (typeof MATERIAL_SLOTS)[number]
