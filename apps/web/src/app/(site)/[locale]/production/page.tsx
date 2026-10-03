import { MapPinIcon } from '@phosphor-icons/react/ssr'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { getServices } from '@/composition/services'
import type { Locale } from '@/i18n/locales'
import { loadProjectOverview } from '@/modules/catalog/application/project-overview'
import { ScheduleChart } from '@/modules/pricing/ui/schedule-chart'
import { ProductionStages } from '@/modules/production/ui/production-stages'
import { pageMetadata } from '@/modules/seo/ui/page-metadata'
import { WallSection } from '@/modules/technology/ui/wall-section'
import { ButtonLink } from '@/ui/components/button/button'
import { Container, Section } from '@/ui/components/layout/container'
import { SectionHeading } from '@/ui/components/section-heading/section-heading'

import styles from './production.module.css'

/** Every request reads current content; caching belongs to the repositories. */
export const dynamic = 'force-dynamic'

interface ProductionPageProps {
  readonly params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: ProductionPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'production.meta' })
  return pageMetadata({
    locale,
    path: '/production',
    title: t('title'),
    description: t('description'),
  })
}

export default async function ProductionPage({ params }: ProductionPageProps) {
  const { locale } = await params
  const [services, t, common] = await Promise.all([
    getServices(locale),
    getTranslations('production'),
    getTranslations('common'),
  ])
  const [content, technology, home] = await Promise.all([
    services.production.load(locale),
    services.technology.load(),
    services.home.load(locale),
  ])
  // The schedule is shown for the project the home page leads with, in its fullest package.
  const reference =
    home.heroProjectSlug === null
      ? null
      : await loadProjectOverview(services, home.heroProjectSlug, locale)
  const fullest = reference?.offers[reference.offers.length - 1]

  return (
    <>
      <Container className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>{content.title}</h1>
          <p className={styles.lead}>{content.lead}</p>
        </header>
        <section aria-labelledby="stages-title" className={styles.block}>
          <SectionHeading id="stages-title" title={t('stages')} lead={t('stagesLead')} />
          <ProductionStages stages={content.stages} />
        </section>
      </Container>

      <Section tone="sunken" aria-labelledby="wall-title">
        <Container>
          <SectionHeading id="wall-title" title={t('wall.title')} lead={t('wall.lead')} />
          <WallSection
            layers={technology.layers}
            insulationOptions={technology.insulationOptions}
          />
        </Container>
      </Section>

      {reference === null || fullest === undefined ? null : (
        <Section aria-labelledby="schedule-title">
          <Container>
            <SectionHeading
              id="schedule-title"
              title={t('schedule.title')}
              lead={t('schedule.lead', {
                project: reference.project.title,
                completeness: fullest.name,
              })}
            />
            <ScheduleChart
              schedule={fullest.schedule}
              labels={{
                axis: common('schedule.axis'),
                total: common('schedule.total'),
                totalValue: common('units.weeks', { count: fullest.schedule.totalWeeks }),
                range: (from, to) =>
                  from === to
                    ? common('schedule.weekSingle', { week: from })
                    : common('schedule.weekRange', { from, to }),
              }}
            />
          </Container>
        </Section>
      )}

      <Section tone="pine" aria-labelledby="visit-title">
        <Container className={styles.cta}>
          <div>
            <h2 id="visit-title" className={styles.ctaTitle}>
              {t('cta.title')}
            </h2>
            <p className={styles.ctaLead}>{t('cta.lead')}</p>
          </div>
          <div className={styles.ctaActions}>
            <ButtonLink href="/contacts" variant="inverse" icon={MapPinIcon}>
              {t('cta.contacts')}
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  )
}
