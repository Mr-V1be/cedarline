import type { ProjectBlueprint } from '@cedarline/configurator'

import type { Locale } from '@/i18n/locales'
import type { ImageAsset } from '@/modules/catalog/domain/project'

export interface FamilyMember {
  readonly id: number
  readonly title: string
  readonly cover: ImageAsset | null
  readonly blueprint: ProjectBlueprint
}

/**
 * A published project with its storey variants (the series it belongs to). The requested
 * project is always a member; members are ordered from fewer to more storeys.
 */
export interface ProjectFamily {
  readonly requested: string
  readonly members: readonly FamilyMember[]
}

export interface ProjectFamilyRepository {
  findFamily(slug: string, locale: Locale): Promise<ProjectFamily | null>
}
