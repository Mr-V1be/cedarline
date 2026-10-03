import { MapPinAreaIcon } from '@phosphor-icons/react/ssr'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { getServices } from '@/composition/services'
import type { Locale } from '@/i18n/locales'
import { summarizeObjects } from '@/modules/built-objects/domain/objects-summary'
import type { ObjectView } from '@/modules/built-objects/ui/object-view'
import { ObjectsExplorer } from '@/modules/built-objects/ui/objects-explorer'
import { pageMetadata } from '@/modules/seo/ui/page-metadata'
import { mapProps } from '@/modules/site/ui/map-props'
import { ButtonLink } from '@/ui/components/button/button'
import { Container } from '@/ui/components/layout/container'
import { StateMessage } from '@/ui/components/state/state-message'

import styles from './objects.module.css'

/** Every request reads current catalog data; caching belongs to the repositories. */
export const dynamic = 'force-dynamic'

interface ObjectsPageProps {
  readonly params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: ObjectsPageProps): Promise<Metadata> {
  const { locale } = await params
  const [t, services] = await Promise.all([
    getTranslations({ locale, namespace: 'objects.meta' }),
    getServices(locale),
  ])
  const [first] = await services.builtObjects.list(locale)
  return pageMetadata({
    locale,
    path: '/objects',
    title: t('title'),
    description: t('description'),
    picture: first?.cover ?? null,
  })
}

export default async function ObjectsPage({ params }: ObjectsPageProps) {
  const { locale } = await params
  const [services, t, common, map] = await Promise.all([
    getServices(locale),
    getTranslations('objects'),
    getTranslations('common'),
    mapProps(),
  ])
  const objects = await services.builtObjects.list(locale)
  const summary = summarizeObjects(objects)
  const views: ObjectView[] = objects.map((object) => ({
    id: object.slug,
    title: object.title,
    place: t('place', { settlement: object.settlement, region: object.region }),
    year: t('year', { year: String(object.year) }),
    area: common('units.area', { value: object.area }),
    builtFrom: object.project === null ? null : t('builtFrom', { project: object.project.title }),
    cover: object.cover,
    location: object.location,
    projectSlug: object.project?.slug ?? null,
  }))

  return (
    <Container className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.lead}>{t('lead')}</p>
        {summary.count > 0 && summary.firstYear !== null && summary.lastYear !== null ? (
          <ul className={styles.facts}>
            <li>{t('facts.houses', { count: summary.count })}</li>
            <li>{t('facts.settlements', { count: summary.settlements })}</li>
            <li>
              {t('facts.years', { from: String(summary.firstYear), to: String(summary.lastYear) })}
            </li>
            <li>{t('facts.area', { value: summary.totalArea })}</li>
          </ul>
        ) : null}
      </header>
      {views.length === 0 ? (
        <StateMessage
          glyph={MapPinAreaIcon}
          title={t('empty.title')}
          description={t('empty.description')}
          action={<ButtonLink href="/projects">{t('empty.action')}</ButtonLink>}
        />
      ) : (
        <ObjectsExplorer
          objects={views}
          map={map}
          labels={{
            list: t('list'),
            card: t('card'),
            close: common('actions.close'),
            project: t('actions.project'),
            configure: t('actions.configure'),
          }}
        />
      )}
    </Container>
  )
}
