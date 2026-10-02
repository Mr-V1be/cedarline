/** Behavioural traits of a room kind. Kinds and traits are catalog data. */
export interface RoomKindTraits {
  readonly bedroom: boolean
  readonly wetZone: boolean
  readonly stair: boolean
}

export type RoomKindCatalog = Readonly<Record<string, RoomKindTraits>>

const NO_TRAITS: RoomKindTraits = { bedroom: false, wetZone: false, stair: false }

export const traitsOf = (catalog: RoomKindCatalog, kind: string): RoomKindTraits =>
  catalog[kind] ?? NO_TRAITS
