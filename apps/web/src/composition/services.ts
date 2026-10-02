import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import type { Locale } from '@/i18n/locales'
import { PayloadHouseContextRepository } from '@/modules/catalog/infrastructure/payload-house-context-repository'
import { PayloadProjectRepository } from '@/modules/catalog/infrastructure/payload-project-repository'
import { PayloadHomeRepository } from '@/modules/home/infrastructure/payload-home-repository'
import { PayloadTariffRepository } from '@/modules/pricing/infrastructure/payload-tariff-repository'
import { PayloadSiteRepository } from '@/modules/site/infrastructure/payload-site-repository'
import { PayloadTechnologyRepository } from '@/modules/technology/infrastructure/payload-technology-repository'

/**
 * Composition root of the site: binds every port to its adapter. Pages and layouts ask for
 * services here and never construct adapters themselves. Memoised per request.
 */
export const getServices = cache(async (locale: Locale) => {
  const payload = await getPayload({ config })
  const technology = new PayloadTechnologyRepository(payload, locale)
  return {
    projects: new PayloadProjectRepository(payload),
    houseContext: new PayloadHouseContextRepository(payload, technology),
    tariff: new PayloadTariffRepository(payload, locale),
    technology,
    home: new PayloadHomeRepository(payload),
    site: new PayloadSiteRepository(payload),
  }
})

export type Services = Awaited<ReturnType<typeof getServices>>
