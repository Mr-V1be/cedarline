import type { ConstructionStandards, RoomKindCatalog } from '@cedarline/house'

import type { Locale } from '@/i18n/locales'

/** Catalog data every house computation needs besides the design itself. */
export interface HouseContext {
  readonly rooms: RoomKindCatalog
  readonly roomNames: Readonly<Record<string, string>>
  readonly standards: ConstructionStandards
}

export interface HouseContextRepository {
  load(locale: Locale): Promise<HouseContext>
}
