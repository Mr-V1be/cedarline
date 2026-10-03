import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { getServices } from '@/composition/services'
import type { Locale } from '@/i18n/locales'
import { pageMetadata } from '@/modules/seo/ui/page-metadata'
import { parseCatalogQuery, type SearchParams } from '@/modules/catalog/domain/catalog-query'
import { ProjectGrid } from '@/modules/catalog/ui/project-grid'
import { Container } from '@/ui/components/layout/container'
import { Pagination } from '@/ui/components/pagination/pagination'

import styles from './picker.module.css'

export const dynamic = 'force-dynamic'

interface PickerPageProps {
  readonly params: Promise<{ locale: Locale }>
  readonly searchParams: Promise<SearchParams>
}

export async function generateMetadata({ params }: PickerPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'configurator.meta' })
  return pageMetadata({
    locale,
    path: '/configurator',
    title: t('pickerTitle'),
    description: t('pickerDescription'),
  })
}

/** Entry of the configurator: every published project, each opening in 3D. */
export default async function ConfiguratorPickerPage({ params, searchParams }: PickerPageProps) {
  const [{ locale }, search] = await Promise.all([params, searchParams])
  const query = parseCatalogQuery({ page: search.page })
  const [services, t, common] = await Promise.all([
    getServices(locale),
    getTranslations('configurator.picker'),
    getTranslations('catalog'),
  ])
  const page = await services.projects.list(query, locale)

  return (
    <Container className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.lead}>{t('lead')}</p>
      </header>
      <ProjectGrid projects={page.items} hrefOf={(project) => `/configurator/${project.slug}`} />
      {page.pageCount > 1 ? (
        <Pagination
          page={page.page}
          pageCount={page.pageCount}
          hrefFor={(target) => (target === 1 ? '/configurator' : `/configurator?page=${target}`)}
          labels={{
            navigation: common('pagination.label'),
            previous: common('pagination.previous'),
            next: common('pagination.next'),
            page: (number) => common('pagination.page', { page: number }),
          }}
        />
      ) : null}
    </Container>
  )
}
