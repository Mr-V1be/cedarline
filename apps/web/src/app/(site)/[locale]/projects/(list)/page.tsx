import { MagnifyingGlassIcon } from '@phosphor-icons/react/ssr'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { getServices } from '@/composition/services'
import type { Locale } from '@/i18n/locales'
import { browseCatalog } from '@/modules/catalog/application/browse-catalog'
import {
  activeFilterCount,
  parseCatalogQuery,
  serializeCatalogQuery,
  withoutFilters,
  type SearchParams,
} from '@/modules/catalog/domain/catalog-query'
import { CatalogBrowser } from '@/modules/catalog/ui/catalog-browser'
import { catalogFields, sortOptions } from '@/modules/catalog/ui/catalog-fields'
import { ProjectGrid } from '@/modules/catalog/ui/project-grid'
import { ButtonLink } from '@/ui/components/button/button'
import { Container } from '@/ui/components/layout/container'
import { Pagination } from '@/ui/components/pagination/pagination'
import { StateMessage } from '@/ui/components/state/state-message'

import styles from './catalog.module.css'

/** Every request reads current catalog data; caching belongs to the repositories. */
export const dynamic = 'force-dynamic'

interface CatalogPageProps {
  readonly params: Promise<{ locale: Locale }>
  readonly searchParams: Promise<SearchParams>
}

export async function generateMetadata({ params }: CatalogPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'catalog.meta' })
  return { title: t('title'), description: t('description') }
}

const hrefWith = (search: string) => (search === '' ? '/projects' : `/projects?${search}`)

export default async function CatalogPage({ params, searchParams }: CatalogPageProps) {
  const [{ locale }, search] = await Promise.all([params, searchParams])
  const query = parseCatalogQuery(search)
  const [services, t] = await Promise.all([getServices(locale), getTranslations()])
  const { page, facets } = await browseCatalog(services.projects, query, locale)
  const [fields, sorts] = await Promise.all([catalogFields(facets), sortOptions()])
  const count = t('catalog.count', { count: page.total })

  return (
    <Container className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('catalog.title')}</h1>
      </header>
      <CatalogBrowser
        query={query}
        fields={fields}
        sorts={sorts}
        labels={{
          filters: t('catalog.filters.title'),
          openFilters: t('catalog.filters.open'),
          openFiltersCount: t('catalog.filters.openCount', { count: activeFilterCount(query) }),
          close: t('common.actions.close'),
          reset: t('catalog.filters.reset'),
          sort: t('catalog.sort.label'),
          show: t('catalog.filters.show', { count: page.total }),
          count,
        }}
      >
        {page.items.length === 0 ? (
          <StateMessage
            glyph={MagnifyingGlassIcon}
            title={t('catalog.empty.title')}
            description={t('catalog.empty.description')}
            action={
              <ButtonLink
                href={hrefWith(serializeCatalogQuery(withoutFilters(query)))}
                variant="secondary"
              >
                {t('catalog.empty.action')}
              </ButtonLink>
            }
          />
        ) : (
          <>
            <ProjectGrid projects={page.items} />
            <div className={styles.pagination}>
              <Pagination
                page={page.page}
                pageCount={page.pageCount}
                hrefFor={(target) => hrefWith(serializeCatalogQuery({ ...query, page: target }))}
                labels={{
                  navigation: t('catalog.pagination.label'),
                  previous: t('catalog.pagination.previous'),
                  next: t('catalog.pagination.next'),
                  page: (target) => t('catalog.pagination.page', { page: target }),
                }}
              />
            </div>
          </>
        )}
      </CatalogBrowser>
    </Container>
  )
}
