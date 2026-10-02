import type { Payload } from 'payload'

import { PROJECT_TYPES, ROOM_KINDS } from '../data/dictionaries'
import { DEMO_USERS } from '../data/users'
import { translate, upsert } from './upsert'

export async function seedUsers(payload: Payload) {
  for (const user of DEMO_USERS) {
    await upsert(payload, 'users', { email: { equals: user.email } }, { ...user })
  }
}

/** Returns the ids of project types and room kinds keyed by slug / key. */
export async function seedDictionaries(payload: Payload) {
  const types = new Map<string, number>()
  for (const type of PROJECT_TYPES) {
    const id = await upsert(
      payload,
      'project-types',
      { slug: { equals: type.slug } },
      { slug: type.slug, order: type.order, title: type.title.ru },
    )
    await translate(payload, 'project-types', id, { title: type.title.en })
    types.set(type.slug, id)
  }

  const roomKinds = new Map<string, number>()
  for (const kind of ROOM_KINDS) {
    const id = await upsert(
      payload,
      'room-kinds',
      { key: { equals: kind.key } },
      {
        key: kind.key,
        title: kind.title.ru,
        bedroom: kind.bedroom ?? false,
        wetZone: kind.wetZone ?? false,
        stair: kind.stair ?? false,
      },
    )
    await translate(payload, 'room-kinds', id, { title: kind.title.en })
    roomKinds.set(kind.key, id)
  }
  return { types, roomKinds }
}
