/** Single registry of site locales: routing, CMS localization and formatting read from it. */
export const LOCALES = ['ru', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'ru'

export interface LocaleDefinition {
  /** Name of the language in that language, for the switcher. */
  readonly nativeName: string
  /** BCP 47 tag for Intl formatting and the html lang attribute. */
  readonly tag: string
  /** Open Graph locale. */
  readonly openGraph: string
}

export const LOCALE_DEFINITIONS: Readonly<Record<Locale, LocaleDefinition>> = {
  ru: { nativeName: 'Русский', tag: 'ru-RU', openGraph: 'ru_RU' },
  en: { nativeName: 'English', tag: 'en-GB', openGraph: 'en_GB' },
}

export const isLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value)
