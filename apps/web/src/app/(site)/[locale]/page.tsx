import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { getDisplayCurrency, getServices } from '@/composition/services'
import { env } from '@/config/env'
import { LOCALE_DEFINITIONS, type Locale } from '@/i18n/locales'
import { BuiltGallery } from '@/modules/built-objects/ui/built-gallery'
import { ProjectCard } from '@/modules/catalog/ui/project-card'
import { loadHomeOverview } from '@/modules/home/application/home-overview'
import { CtaBand } from '@/modules/home/ui/cta-band'
import { businessSchema, websiteSchema } from '@/modules/seo/application/structured-data'
import { JsonLd } from '@/modules/seo/ui/json-ld'
import { localizedPath, pageMetadata } from '@/modules/seo/ui/page-metadata'
import { HeroSection } from '@/modules/home/ui/hero-section'
import { SectionHeading } from '@/ui/components/section-heading/section-heading'
import { ScheduleChart } from '@/modules/pricing/ui/schedule-chart'
import { WallSection } from '@/modules/technology/ui/wall-section'
import { ButtonLink } from '@/ui/components/button/button'
import { Container, Section } from '@/ui/components/layout/container'
import { ClientMessages } from '@/i18n/client-messages'

import styles from './home.module.css'

/** Every request reads current catalog data; caching belongs to the repositories. */
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'common.meta' })
  return pageMetadata({ locale, path: '/', title: t('title'), description: t('description') })
}

export default async function HomePage({
  params,
}: {
  readonly params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const [services, t, common, currency] = await Promise.all([
    getServices(locale),
    getTranslations('home'),
    getTranslations('common'),
    getDisplayCurrency(locale),
  ])
  const [{ hero, featured, builtObjects, technology }, site] = await Promise.all([
    loadHomeOverview(services, locale),
    services.site.load(locale),
  ])
  const homeUrl = `${env.SITE_URL}${localizedPath(locale, '/')}`
  const fullest = hero?.offers[hero.offers.length - 1]
  const ctaImage =
    hero?.project.gallery.find((item) => item.view === 'aerial')?.image ??
    hero?.project.cover ??
    null

  return (
    <>
      <JsonLd
        data={websiteSchema({
          name: common('brand.name'),
          url: homeUrl,
          language: LOCALE_DEFINITIONS[locale].tag,
        })}
      />
      <JsonLd
        data={businessSchema({
          name: common('brand.name'),
          url: homeUrl,
          logo: `${env.SITE_URL}/icon.svg`,
          site,
        })}
      />
      <HeroSection hero={hero} currency={currency} />

      {featured.length > 0 ? (
        <Section aria-labelledby="featured">
          <Container>
            <SectionHeading
              id="featured"
              title={t('featured.title')}
              lead={t('featured.lead')}
              aside={
                <ButtonLink href="/projects" variant="secondary">
                  {common('actions.allProjects')}
                </ButtonLink>
              }
            />
            <ul className={styles.cards}>
              {featured.map((project) => (
                <li key={project.id}>
                  <ProjectCard
                    project={project}
                    currency={currency}
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <Section tone="sunken" id="technology" aria-labelledby="technology-title">
        <Container>
          <SectionHeading
            id="technology-title"
            title={t('technology.title')}
            lead={t('technology.lead')}
          />
          <ClientMessages namespaces={['home.technology']}>
            <WallSection
              layers={technology.layers}
              insulationOptions={technology.insulationOptions}
            />
          </ClientMessages>
        </Container>
      </Section>

      {hero !== null && fullest !== undefined ? (
        <Section id="process" aria-labelledby="process-title">
          <Container>
            <SectionHeading
              id="process-title"
              title={t('process.title')}
              lead={t('process.lead', { project: hero.project.title, completeness: fullest.name })}
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
      ) : null}

      {builtObjects.length > 0 ? (
        <Section id="built" aria-labelledby="built-title">
          <Container>
            <SectionHeading id="built-title" title={t('built.title')} />
            <BuiltGallery objects={builtObjects} />
          </Container>
        </Section>
      ) : null}

      {hero === null ? null : (
        <CtaBand
          title={t('cta.title')}
          lead={t('cta.lead')}
          action={common('actions.configure')}
          href={`/configurator/${hero.project.slug}`}
          image={ctaImage}
        />
      )}
    </>
  )
}
