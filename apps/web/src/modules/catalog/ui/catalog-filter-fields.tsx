'use client'

import { SelectField, type SelectOption } from '@/ui/components/select/select-field'

import type { CatalogFilters, CatalogQuery } from '../domain/catalog-query'
import styles from './catalog-browser.module.css'

/** A filter as a dropdown: options are prepared on the server from what the catalog contains. */
export interface FilterField {
  readonly key: keyof CatalogFilters
  readonly label: string
  /** The first option is «any» with an empty value. */
  readonly options: readonly SelectOption[]
  /** Fields that share a row, e.g. area from / to. */
  readonly group?: string
}

interface CatalogFilterFieldsProps {
  readonly query: CatalogQuery
  readonly fields: readonly FilterField[]
  readonly onChange: (key: keyof CatalogFilters, value: string | number | undefined) => void
}

export function CatalogFilterFields({ query, fields, onChange }: CatalogFilterFieldsProps) {
  const rows: FilterField[][] = []
  for (const field of fields) {
    const last = rows[rows.length - 1]
    if (field.group !== undefined && last?.[0]?.group === field.group) last.push(field)
    else rows.push([field])
  }
  return (
    <div className={styles.fields}>
      {rows.map((row) => (
        <div
          key={row.map((field) => field.key).join('-')}
          className={row.length > 1 ? styles.fieldRow : undefined}
        >
          {row.map((field) => (
            <SelectField
              key={field.key}
              label={field.label}
              value={query[field.key] === undefined ? '' : String(query[field.key])}
              options={field.options}
              onChange={(event) => {
                const { value } = event.target
                const numeric = Number(value)
                onChange(
                  field.key,
                  value === ''
                    ? undefined
                    : field.key === 'type' || field.key === 'storeys'
                      ? value
                      : numeric,
                )
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
