import { cache } from 'react'

import { getServices } from '@/composition/services'
import type { Locale } from '@/i18n/locales'

/** Layout and metadata of the configurator share one lookup of the project per request. */
export const loadMember = cache(async (slug: string, locale: Locale) => {
  const family = await (await getServices(locale)).configurator.families.findFamily(slug, locale)
  return family?.members.find((candidate) => candidate.blueprint.slug === slug) ?? null
})
