import type { Locale } from '@/i18n/locales'

import type { SiteContent } from '../domain/site'

export interface SiteRepository {
  load(locale: Locale): Promise<SiteContent>
}
