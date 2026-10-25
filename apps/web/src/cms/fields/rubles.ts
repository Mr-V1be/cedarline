import type { NumberField } from 'payload'

import { createPriceFormatter } from '@/modules/pricing/application/price-formatter'
import { BASE_DISPLAY } from '@/modules/pricing/domain/exchange-rate'

import type { Labels } from './labels'

const { symbol } = createPriceFormatter(BASE_DISPLAY)

/** Staff read sums in the tariff's own currency, so every such label says so: «Сумма, ₽». */
export const inRubles = (labels: Labels): Labels => ({
  ru: `${labels.ru}, ${symbol}`,
  en: `${labels.en}, ${symbol}`,
})

/**
 * A computed sum in whole rubles: stored as a number, shown in the CMS as the Russian site shows
 * it («2 690 732 ₽») in the document and in the list, whatever the editor's language — the
 * CMS works in the tariff's currency. Staff never type it, so it is read-only.
 */
export const rublesField = ({
  name,
  label,
  index = false,
  width,
}: {
  readonly name: string
  readonly label: Labels
  readonly index?: boolean
  readonly width?: string
}): NumberField => ({
  name,
  type: 'number',
  label: inRubles(label),
  index,
  admin: {
    readOnly: true,
    ...(width === undefined ? {} : { width }),
    components: {
      Field: '/cms/admin/rubles#RublesField',
      Cell: '/cms/admin/rubles#RublesCell',
    },
  },
})
