import type { BuiltObject as BuiltObjectDocument } from '@/cms/generated/payload-types'
import { toImageAsset } from '@/modules/catalog/infrastructure/media-mapper'

import type { BuiltObject } from '../domain/built-object'

/** The fields of a built house the site reads; listings select only these. */
export type BuiltObjectFields = Pick<
  BuiltObjectDocument,
  | 'id'
  | 'slug'
  | 'title'
  | 'settlement'
  | 'region'
  | 'year'
  | 'area'
  | 'location'
  | 'cover'
  | 'project'
>

export function toBuiltObject(document: BuiltObjectFields): BuiltObject {
  const project = document.project
  const published =
    project !== null &&
    project !== undefined &&
    typeof project !== 'number' &&
    project.status === 'published'
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
    project: published ? { slug: project.slug, title: project.title } : null,
  }
}
