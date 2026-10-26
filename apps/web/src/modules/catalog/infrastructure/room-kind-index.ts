import type { RoomKindCatalog } from '@cedarline/house'
import type { Payload, PayloadRequest } from 'payload'

import type { Locale } from '@/i18n/locales'

/** Room kinds keyed both by CMS id (relationships) and by stable key (house domain). */
export interface RoomKindIndex {
  readonly catalog: RoomKindCatalog
  readonly names: Readonly<Record<string, string>>
  readonly keyOf: (id: number) => string
}

/** Room kinds are a small dictionary, so the whole set is read in one query. */
export async function loadRoomKindIndex(
  payload: Payload,
  locale: Locale,
  req?: PayloadRequest,
): Promise<RoomKindIndex> {
  const { docs } = await payload.find({
    collection: 'room-kinds',
    locale,
    depth: 0,
    pagination: false,
    ...(req === undefined ? {} : { req }),
  })
  const keys = new Map(docs.map((doc) => [doc.id, doc.key]))
  return {
    catalog: Object.fromEntries(
      docs.map((doc) => [
        doc.key,
        { bedroom: doc.bedroom ?? false, wetZone: doc.wetZone ?? false, stair: doc.stair ?? false },
      ]),
    ),
    names: Object.fromEntries(docs.map((doc) => [doc.key, doc.title])),
    keyOf: (id) => {
      const key = keys.get(id)
      if (key === undefined) throw new Error(`Unknown room kind id ${id}`)
      return key
    },
  }
}
