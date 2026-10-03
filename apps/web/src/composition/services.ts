import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import type { Locale } from '@/i18n/locales'

import { siteServices } from './site-services'

/** The site's services for a request, memoised: pages, layouts and actions share one set. */
export const getServices = cache(async (locale: Locale) =>
  siteServices(await getPayload({ config }), locale),
)

export type { Services } from './site-services'
