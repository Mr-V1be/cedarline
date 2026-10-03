import type { Locale } from '@/i18n/locales'

import type { BuiltObject } from '../domain/built-object'

export interface BuiltObjectRepository {
  /** Published built houses, newest first. */
  list(locale: Locale): Promise<readonly BuiltObject[]>
}
