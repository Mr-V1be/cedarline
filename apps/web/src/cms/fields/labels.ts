import type { Locale } from '@/i18n/locales'

/** Admin labels in every CMS language; Payload picks the one matching the editor's language. */
export type Labels = Readonly<Record<Locale, string>>

export const label = (ru: string, en: string): Labels => ({ ru, en })
