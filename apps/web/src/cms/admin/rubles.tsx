'use client'

import type { DefaultCellComponentProps, NumberFieldClientComponent } from 'payload'
import { TextInput, useField, useTranslation } from '@payloadcms/ui'

import { RUBLES_FORMAT } from '@/modules/pricing/ui/money'

/** The amount as the site writes it, in the language of the CMS: «2 690 732 ₽». */
function useRubles() {
  const { i18n } = useTranslation()
  const format = new Intl.NumberFormat(i18n.language === 'en' ? 'en' : 'ru', RUBLES_FORMAT)
  return (value: unknown) => (typeof value === 'number' ? format.format(value) : '')
}

/** List column of a computed sum. */
export function RublesCell({ cellData }: DefaultCellComponentProps<never, unknown>) {
  const rubles = useRubles()
  return <span className="rubles-cell">{rubles(cellData)}</span>
}

/** A computed sum in a document: read-only, written with digit groups and the ruble sign. */
export const RublesField: NumberFieldClientComponent = ({ field, path }) => {
  const rubles = useRubles()
  const { value } = useField<number>({ path })
  return (
    <TextInput
      path={path}
      label={field.label}
      value={rubles(value)}
      readOnly
      style={field.admin?.width === undefined ? undefined : { width: field.admin.width }}
    />
  )
}
