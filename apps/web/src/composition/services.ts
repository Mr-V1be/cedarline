import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import type { Locale } from '@/i18n/locales'
import { DISPLAY_CURRENCIES } from '@/modules/pricing/domain/currencies'
import { displayCurrencyFor, type DisplayCurrency } from '@/modules/pricing/domain/exchange-rate'

import { siteServices } from './site-services'

/** The site's services for a request, memoised: pages, layouts and actions share one set. */
export const getServices = cache(async (locale: Locale) =>
  siteServices(await getPayload({ config }), locale),
)

/**
 * The currency a visitor of a language sees prices in, at today's rates; one read per request
 * for the layout and the page. Without a rate the language shows rubles, and the log says why.
 */
export const getDisplayCurrency = cache(async (locale: Locale): Promise<DisplayCurrency> => {
  const services = await getServices(locale)
  const display = displayCurrencyFor(locale, await services.exchangeRates.load())
  if (display.currency !== DISPLAY_CURRENCIES[locale]) {
    services.logger.warn(
      `No ${DISPLAY_CURRENCIES[locale]} exchange rate in the CMS: the ${locale} site shows ${display.currency}`,
    )
  }
  return display
})

export type { Services } from './site-services'
