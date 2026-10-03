import { cache } from 'react'

import { getServices } from '@/composition/services'
import type { Locale } from '@/i18n/locales'

/** Layout, metadata and page of an article share one load per request. */
export const loadArticle = cache(async (slug: string, locale: Locale) =>
  (await getServices(locale)).articles.findBySlug(slug, locale),
)
