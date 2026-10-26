'use client'

import { Money } from '@cedarline/pricing'
import type { DefaultCellComponentProps, NumberFieldClientComponent } from 'payload'
import { TextInput, useField } from '@payloadcms/ui'

import { createPriceFormatter } from '@/modules/pricing/application/price-formatter'
import { BASE_DISPLAY } from '@/modules/pricing/domain/exchange-rate'

/** The CMS keeps the tariff's currency: sums read as on the Russian site, «2 690 732 ₽». */
const rubles = createPriceFormatter(BASE_DISPLAY)

const written = (value: unknown) =>
  typeof value === 'number' ? rubles.format(Money.ofRubles(value), 'exact') : ''

/** List column of a computed sum. */
export function RublesCell({ cellData }: DefaultCellComponentProps<never, unknown>) {
  return <span className="rubles-cell">{written(cellData)}</span>
}

/** A computed sum in a document: read-only, written with digit groups and the ruble sign. */
export const RublesField: NumberFieldClientComponent = ({ field, path }) => {
  const { value } = useField<number>({ path })
  return (
    <TextInput
      path={path}
      label={field.label}
      value={written(value)}
      readOnly
      style={field.admin?.width === undefined ? undefined : { width: field.admin.width }}
    />
  )
}
