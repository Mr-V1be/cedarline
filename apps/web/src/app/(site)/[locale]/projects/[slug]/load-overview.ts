import { cache } from 'react'

import { getServices } from '@/composition/services'
import type { Locale } from '@/i18n/locales'
import { loadProjectOverview } from '@/modules/catalog/application/project-overview'

/** Layout, metadata and page of a project share one load per request. */
export const loadOverview = cache(async (slug: string, locale: Locale) =>
  loadProjectOverview(await getServices(locale), slug, locale),
)
