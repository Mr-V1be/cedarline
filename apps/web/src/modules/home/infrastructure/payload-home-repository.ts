import type { Payload } from 'payload'

import type { BuiltObject as BuiltObjectDocument, Project } from '@/cms/generated/payload-types'
import type { Locale } from '@/i18n/locales'
import { toBuiltObject } from '@/modules/built-objects/infrastructure/built-object-mapper'
import { toProjectSummary } from '@/modules/catalog/infrastructure/project-read-mapper'

import type { HomeRepository, HomeSelection } from '../ports/home-repository'

const isPublished = <T extends { status: string }>(
  value: number | T | null | undefined,
): value is T =>
  value !== null && value !== undefined && typeof value !== 'number' && value.status === 'published'

export class PayloadHomeRepository implements HomeRepository {
  constructor(private readonly payload: Payload) {}

  /** One query: relations and their images are joined by depth instead of fetched one by one. */
  async load(locale: Locale): Promise<HomeSelection> {
    const home = await this.payload.findGlobal({
      slug: 'home',
      locale,
      depth: 2,
      overrideAccess: false,
    })
    const hero = home.heroProject
    return {
      heroProjectSlug: isPublished<Project>(hero) ? hero.slug : null,
      featured: (home.featuredProjects ?? []).filter(isPublished<Project>).map(toProjectSummary),
      builtObjects: (home.builtObjects ?? [])
        .filter(isPublished<BuiltObjectDocument>)
        .map(toBuiltObject),
    }
  }
}
