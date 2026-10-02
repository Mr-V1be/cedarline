import type { Locale } from '@/i18n/locales'
import type { BuiltObject } from '@/modules/built-objects/domain/built-object'
import type { ProjectSummary } from '@/modules/catalog/domain/project'

/** Editorial selection of the home page, with only published documents. */
export interface HomeSelection {
  readonly heroProjectSlug: string | null
  readonly featured: readonly ProjectSummary[]
  readonly builtObjects: readonly BuiltObject[]
}

export interface HomeRepository {
  load(locale: Locale): Promise<HomeSelection>
}
