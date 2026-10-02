'use client'

import { FadersHorizontalIcon } from '@phosphor-icons/react/ssr'
import { useState, useTransition, type ReactNode } from 'react'

import { useRouter } from '@/i18n/navigation'
import { Button } from '@/ui/components/button/button'
import type { SelectOption } from '@/ui/components/select/select-field'
import { SelectField } from '@/ui/components/select/select-field'
import { Sheet } from '@/ui/components/sheet/sheet'

import {
  activeFilterCount,
  serializeCatalogQuery,
  type CatalogFilters as Filters,
  type CatalogQuery,
  type CatalogSort,
} from '../domain/catalog-query'
import styles from './catalog-browser.module.css'
import { CatalogFilterFields, type FilterField } from './catalog-filter-fields'

export interface CatalogBrowserLabels {
  readonly filters: string
  readonly openFilters: string
  readonly openFiltersCount: string
  readonly close: string
  readonly reset: string
  readonly sort: string
  readonly show: string
  readonly count: string
}

interface CatalogBrowserProps {
  readonly query: CatalogQuery
  readonly fields: readonly FilterField[]
  readonly sorts: readonly SelectOption[]
  readonly labels: CatalogBrowserLabels
  readonly children: ReactNode
}

/**
 * The catalog's interactive frame. The URL is the only state: every change replaces the query
 * string, the server renders the new results, and the old ones stay visible but dimmed until
 * the new page arrives.
 */
export function CatalogBrowser({ query, fields, sorts, labels, children }: CatalogBrowserProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [sheetOpen, setSheetOpen] = useState(false)
  const active = activeFilterCount(query)

  const navigate = (next: Partial<CatalogQuery>) => {
    const search = serializeCatalogQuery({ ...query, ...next, page: next.page ?? 1 })
    startTransition(() => {
      router.replace(search === '' ? '/projects' : `/projects?${search}`, { scroll: false })
    })
  }
  const setFilter = (key: keyof Filters, value: string | number | undefined) => {
    navigate({ [key]: value === '' ? undefined : value })
  }
  const reset = () => {
    startTransition(() => {
      const search = serializeCatalogQuery({ sort: query.sort })
      router.replace(search === '' ? '/projects' : `/projects?${search}`, { scroll: false })
    })
  }

  const filterFields = <CatalogFilterFields query={query} fields={fields} onChange={setFilter} />

  return (
    <div className={styles.browser}>
      <aside className={styles.sidebar} aria-label={labels.filters}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>{labels.filters}</h2>
          {active > 0 ? (
            <Button variant="quiet" onClick={reset}>
              {labels.reset}
            </Button>
          ) : null}
        </div>
        {filterFields}
      </aside>

      <div className={styles.results}>
        <div className={styles.toolbar}>
          <p className={styles.count} aria-live="polite">
            {labels.count}
          </p>
          <div className={styles.toolbarActions}>
            <div className={styles.filtersButton}>
              <Button
                variant="secondary"
                icon={FadersHorizontalIcon}
                onClick={() => {
                  setSheetOpen(true)
                }}
              >
                {active > 0 ? labels.openFiltersCount : labels.openFilters}
              </Button>
            </div>
            <SelectField
              className={styles.sort}
              label={labels.sort}
              hideLabel
              value={query.sort}
              options={sorts}
              onChange={(event) => {
                navigate({ sort: event.target.value as CatalogSort })
              }}
            />
          </div>
        </div>
        <div
          className={pending ? `${styles.list} ${styles.pending}` : styles.list}
          aria-busy={pending}
        >
          {children}
        </div>
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false)
        }}
        title={labels.filters}
        closeLabel={labels.close}
        footer={
          <div className={styles.sheetActions}>
            {active > 0 ? (
              <Button variant="secondary" onClick={reset}>
                {labels.reset}
              </Button>
            ) : null}
            <Button
              stretch
              onClick={() => {
                setSheetOpen(false)
              }}
              disabled={pending}
            >
              {labels.show}
            </Button>
          </div>
        }
      >
        {filterFields}
      </Sheet>
    </div>
  )
}
