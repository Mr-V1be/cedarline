import type { BuiltObject as BuiltObjectDocument } from '@/cms/generated/payload-types'
import { toImageAsset } from '@/modules/catalog/infrastructure/media-mapper'

import type { BuiltObject } from '../domain/built-object'

export function toBuiltObject(document: BuiltObjectDocument): BuiltObject {
  const project = document.project
  return {
    id: document.id,
    slug: document.slug,
    title: document.title,
    settlement: document.settlement,
    region: document.region,
    year: document.year,
    area: document.area,
    location: document.location,
    cover: toImageAsset(document.cover),
    projectSlug:
      project !== null && project !== undefined && typeof project !== 'number'
        ? project.slug
        : null,
  }
}
