import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Money } from '@kedrovnik/pricing'
import { getTranslations } from 'next-intl/server'

import { getDisplayCurrency, getServices } from '@/composition/services'
import { env } from '@/config/env'
import type { Locale } from '@/i18n/locales'
import { ProjectActionBar } from '@/modules/catalog/ui/project-action-bar'
import { ProjectGrid } from '@/modules/catalog/ui/project-grid'
import { HouseStage } from '@/modules/house-3d/ui/house-stage'
import { FloorPlans } from '@/modules/plans/ui/floor-plans'
import { createPriceFormatter } from '@/modules/pricing/application/price-formatter'
import { Offers } from '@/modules/pricing/ui/offers'
import { breadcrumbSchema, productSchema } from '@/modules/seo/application/structured-data'
import { JsonLd } from '@/modules/seo/ui/json-ld'
import { localizedPath, pageMetadata } from '@/modules/seo/ui/page-metadata'
import { resolveWall } from '@/modules/technology/domain/wall-assembly'
import { Facts } from '@/ui/components/facts/facts'
import { Container, Section } from '@/ui/components/layout/container'
import { SectionHeading } from '@/ui/components/section-heading/section-heading'
import { ClientMessages } from '@/i18n/client-messages'

import { loadOverview } from './load-overview'

/** Every request reads current catalog data; caching belongs to the repositories. */
export const dynamic = 'force-dynamic'

interface ProjectPageProps {
  readonly params: Promise<{ locale: Locale; slug: string }>
}

const SIMILAR_COUNT = 3

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const overview = await loadOverview(slug, locale)
  if (overview === null) return {}
  const { project } = overview
  const t = await getTranslations({ locale, namespace: 'project.meta' })
  return pageMetadata({
    locale,
    path: `/projects/${project.slug}`,
    title: t('title', { type: project.type.title, name: project.title }),
    description: project.summary,
    picture: project.cover,
  })
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { locale, slug } = await params
  const overview = await loadOverview(slug, locale)
  if (overview === null) notFound()
  const services = await getServices(locale)
  const { project, offers, takeoff, plans, roomNames, viewer: input } = overview
  const [technology, similar, t, common, registry, viewer, currency] = await Promise.all([
    services.technology.load(),
    services.projects.findSimilar(project, SIMILAR_COUNT, locale),
    getTranslations('project'),
    getTranslations('common'),
    getTranslations('registry'),
    getTranslations('viewer'),
    getDisplayCurrency(locale),
  ])
  const wall = resolveWall(technology.layers, project.options.insulation)
  const prices = createPriceFormatter(currency)
  const fromPrice = project.pricing === null ? null : Money.ofRubles(project.pricing.fromPrice)

  const url = (path: string) => `${env.SITE_URL}${localizedPath(locale, path)}`

  return (
    <div>
      <JsonLd
        data={productSchema({
          name: project.title,
          description: project.summary,
          url: url(`/projects/${project.slug}`),
          image: project.cover === null ? null : `${env.SITE_URL}/files/og/${project.cover.id}.jpg`,
          category: project.type.title,
          priceFrom:
            fromPrice === null
              ? null
              : { amount: prices.value(fromPrice, 'from'), currency: currency.currency },
          packages: offers.length,
          sellerUrl: url('/'),
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: t('breadcrumbs.catalog'), url: url('/projects') },
          { name: project.title, url: url(`/projects/${project.slug}`) },
        ])}
      />
      <Section id="model" aria-labelledby="model-title">
        <Container>
          <SectionHeading id="model-title" title={t('gallery.model')} />
          <HouseStage
            input={input}
            poster={project.cover}
            sizes="100vw"
            labels={{
              model: viewer('label', { project: project.title }),
              open: common('actions.open3d'),
              views: viewer('views.label'),
              unsupported: viewer('unsupported'),
              presets: {
                corner: viewer('views.corner'),
                front: viewer('views.front'),
                aerial: viewer('views.aerial'),
              },
            }}
          />
        </Container>
      </Section>

      <Section tone="sunken" id="plan" aria-labelledby="plan-title">
        <Container>
          <SectionHeading id="plan-title" title={t('plan.title')} />
          <ClientMessages namespaces={['project.plan']}>
            <FloorPlans plans={plans} roomNames={roomNames} />
          </ClientMessages>
        </Container>
      </Section>

      <Section id="offers" aria-labelledby="offers-title">
        <Container>
          <SectionHeading
            id="offers-title"
            title={t('completeness.title')}
            lead={t('completeness.lead')}
          />
          <Offers offers={offers} currency={currency} />
        </Container>
      </Section>

      <Section tone="sunken" id="specs" aria-labelledby="specs-title">
        <Container>
          <SectionHeading id="specs-title" title={t('specs.title')} />
          <Facts
            columns={3}
            items={[
              {
                key: 'wall',
                label: t('specs.wall'),
                value: t('specs.wallValue', {
                  insulation: project.options.insulation,
                  total: wall.totalThickness,
                }),
              },
              {
                key: 'thermal',
                label: t('specs.thermal'),
                value: t('specs.thermalValue', { value: wall.thermalResistance }),
              },
              {
                key: 'roof',
                label: t('specs.roof'),
                value: t('specs.roofValue', {
                  kind: registry(`roofKind.${project.options.roofKind}`),
                  pitch: project.options.roofPitch ?? 0,
                }),
              },
              {
                key: 'facade',
                label: t('specs.facade'),
                value: registry(`facadeFinish.${project.options.facadeFinish}`),
              },
              {
                key: 'windows',
                label: t('specs.windows'),
                value: registry(`windowStyle.${project.options.windowStyle}`),
              },
              {
                key: 'ceiling',
                label: t('specs.ceiling'),
                value: common('units.metres', { value: project.design.storeyHeight / 1000 }),
              },
              {
                key: 'foundation',
                label: t('specs.foundation'),
                value: t('specs.foundationValue', { count: takeoff.pileCount }),
              },
            ]}
          />
        </Container>
      </Section>

      {similar.length > 0 ? (
        <Section aria-labelledby="similar-title">
          <Container>
            <SectionHeading id="similar-title" title={t('similar.title')} />
            <ProjectGrid projects={similar} currency={currency} leading={false} />
          </Container>
        </Section>
      ) : null}

      {fromPrice === null ? null : (
        <ProjectActionBar
          priceLabel={t('price.from')}
          price={prices.format(fromPrice, 'from')}
          action={common('actions.configure')}
          href={`/configurator/${project.slug}`}
        />
      )}
    </div>
  )
}
