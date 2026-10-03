import type { Locale } from '@/i18n/locales'

import type { ProductionContent } from '../domain/production'

export interface ProductionRepository {
  load(locale: Locale): Promise<ProductionContent>
}
