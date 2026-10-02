import type { Payload } from 'payload'

import type { Locale } from '@/i18n/locales'
import { PUBLISHED } from '@/modules/catalog/infrastructure/catalog-where'
import { toProjectSummary } from '@/modules/catalog/infrastructure/project-read-mapper'
import { loadRoomKindIndex } from '@/modules/catalog/infrastructure/room-kind-index'

import type {
  FamilyMember,
  ProjectFamily,
  ProjectFamilyRepository,
} from '../ports/project-family-repository'
import { seriesRootOf, toBlueprint } from './blueprint-mapper'

const PUBLIC = { overrideAccess: false } as const
/** A series holds a handful of storey variants. */
const FAMILY_LIMIT = 8

const levelsOf = (member: FamilyMember) =>
  member.blueprint.design.storeys + (member.blueprint.design.attic ? 0.5 : 0)

export class PayloadProjectFamilyRepository implements ProjectFamilyRepository {
  constructor(private readonly payload: Payload) {}

  async findFamily(slug: string, locale: Locale): Promise<ProjectFamily | null> {
    const { docs } = await this.payload.find({
      ...PUBLIC,
      collection: 'projects',
      locale,
      depth: 0,
      limit: 1,
      where: { and: [PUBLISHED, { slug: { equals: slug } }] },
      select: { configurator: true },
    })
    const requested = docs[0]
    if (requested === undefined) return null
    const root = seriesRootOf(requested)

    const [family, rooms] = await Promise.all([
      this.payload.find({
        ...PUBLIC,
        collection: 'projects',
        locale,
        depth: 1,
        limit: FAMILY_LIMIT,
        sort: 'sortOrder',
        where: {
          and: [
            PUBLISHED,
            { or: [{ id: { equals: root } }, { 'configurator.variantOf': { equals: root } }] },
          ],
        },
      }),
      loadRoomKindIndex(this.payload, locale),
    ])
    const members = family.docs
      .map((document): FamilyMember => ({
        id: document.id,
        title: document.title,
        cover: toProjectSummary(document).cover,
        blueprint: toBlueprint(document, rooms.keyOf),
      }))
      .sort((left, right) => levelsOf(left) - levelsOf(right))
    // The requested project is published; it may be missing only if it points to a hidden root.
    if (!members.some((member) => member.blueprint.slug === slug)) return null
    return { requested: slug, members }
  }
}
