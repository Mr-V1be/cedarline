import { defineRouting } from 'next-intl/routing'

import { DEFAULT_LOCALE, LOCALES } from './locales'

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  // Russian is the primary audience: it lives at the root, English under /en.
  localePrefix: 'as-needed',
})
