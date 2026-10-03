import type { Payload } from 'payload'

import type { Locale } from '@/i18n/locales'

import type { BuiltObject } from '../domain/built-object'
import type { BuiltObjectRepository } from '../ports/built-object-repository'
import { toBuiltObject } from './built-object-mapper'

/**
 * Upper bound of houses on one map. The company builds dozens a year; when the list outgrows
 * this, the map switches to loading points by viewport instead of raising the bound.
 */
const MAP_LIMIT = 1000

export class PayloadBuiltObjectRepository implements BuiltObjectRepository {
  constructor(private readonly payload: Payload) {}

  async list(locale: Locale): Promise<readonly BuiltObject[]> {
    const { docs } = await this.payload.find({
      collection: 'built-objects',
      locale,
      depth: 1,
      limit: MAP_LIMIT,
      pagination: false,
      sort: ['-year', 'title'],
      where: { status: { equals: 'published' } },
      overrideAccess: false,
      select: {
        slug: true,
        title: true,
        settlement: true,
        region: true,
        year: true,
        area: true,
        location: true,
        cover: true,
        project: true,
      },
      populate: { projects: { slug: true, title: true, status: true } },
    })
    return docs.map(toBuiltObject)
  }
}
