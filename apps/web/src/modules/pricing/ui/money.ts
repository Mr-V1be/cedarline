import type { createFormatter } from 'next-intl'

type Formatter = ReturnType<typeof createFormatter>

/** How whole rubles are written everywhere, on the site and in the CMS: «5 093 761 ₽». */
export const RUBLES_FORMAT = {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
} as const satisfies Intl.NumberFormatOptions

/** Whole rubles as currency in the visitor's locale: «5 093 761 ₽». */
export const formatRubles = (format: Formatter, rubles: number): string =>
  format.number(rubles, RUBLES_FORMAT)

/** Short form for filter thresholds: «5 млн ₽». */
export const formatRublesCompact = (format: Formatter, rubles: number): string =>
  format.number(rubles, {
    style: 'currency',
    currency: 'RUB',
    notation: 'compact',
    maximumFractionDigits: 1,
  })
