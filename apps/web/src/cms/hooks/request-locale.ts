import type { PayloadRequest } from 'payload'

import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/locales'

/**
 * Local API calls that share `req` adopt the locale they are given for the whole request, so
 * reads inside a hook must use the request's own locale or they would switch the locale of
 * the save in progress.
 */
export function requestLocale(req: PayloadRequest): Locale {
  return typeof req.locale === 'string' && isLocale(req.locale) ? req.locale : DEFAULT_LOCALE
}
