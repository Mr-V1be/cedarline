import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { loadMessages } from './messages'
import { routing } from './routing'

/*
 * The locale comes from the [locale] segment via the proxy. `next/root-params` cannot replace
 * it here: the CMS has its own root layout, so the app has no root parameter shared by all
 * root layouts and Next.js does not generate the getter.
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale
  return { locale, messages: await loadMessages(locale) }
})
