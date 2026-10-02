import type { createFormatter } from 'next-intl'

type Formatter = ReturnType<typeof createFormatter>

/** Whole rubles as currency in the visitor's locale: «5 093 761 ₽». */
export const formatRubles = (format: Formatter, rubles: number): string =>
  format.number(rubles, { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })

/** Short form for filter thresholds: «5 млн ₽». */
export const formatRublesCompact = (format: Formatter, rubles: number): string =>
  format.number(rubles, {
    style: 'currency',
    currency: 'RUB',
    notation: 'compact',
    maximumFractionDigits: 1,
  })
