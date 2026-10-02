import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getFormatter, getTranslations } from 'next-intl/server'

import { getServices } from '@/composition/services'
import type { Locale } from '@/i18n/locales'
import { ProjectActionBar } from '@/modules/catalog/ui/project-action-bar'
import { ProjectGrid } from '@/modules/catalog/ui/project-grid'
import { ProjectSummary } from '@/modules/catalog/ui/project-summary'
import { HouseStage } from '@/modules/house-3d/ui/house-stage'
import { FloorPlans } from '@/modules/plans/ui/floor-plans'
import { formatRubles } from '@/modules/pricing/ui/money'
import { Offers } from '@/modules/pricing/ui/offers'
import { resolveWall } from '@/modules/technology/domain/wall-assembly'
import { Breadcrumbs } from '@/ui/components/breadcrumbs/breadcrumbs'
import { Facts } from '@/ui/components/facts/facts'
import { Gallery } from '@/ui/components/gallery/gallery'
import { Container, Section } from '@/ui/components/layout/container'
import { SectionHeading } from '@/ui/components/section-heading/section-heading'

import { loadOverview } from './load-overview'
import styles from './project.module.css'

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
  return {
    title: t('title', { type: project.type.title, name: project.title }),
    description: project.summary,
    openGraph:
      project.cover === null
        ? undefined
        : { images: [{ url: project.cover.url, alt: project.cover.alt }] },
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { locale, slug } = await params
  const overview = await loadOverview(slug, locale)
  if (overview === null) notFound()
  const services = await getServices(locale)
  const { project, offers, takeoff, plans, roomNames, viewer: input } = overview
  const [technology, similar, t, common, registry, viewer, format] = await Promise.all([
    services.technology.load(),
    services.projects.findSimilar(project, SIMILAR_COUNT, locale),
    getTranslations('project'),
    getTranslations('common'),
    getTranslations('registry'),
    getTranslations('viewer'),
    getFormatter(),
  ])
  const wall = resolveWall(technology.layers, project.options.insulation)
  const cheapest = offers.find((offer) => offer.key === project.pricing?.fromCompleteness) ?? null

  return (
    <div>
      <Container className={styles.top}>
        <Breadcrumbs
          label={t('breadcrumbs.label')}
          items={[{ label: t('breadcrumbs.catalog'), href: '/projects' }, { label: project.title }]}
        />
        <div className={styles.hero}>
          <div className={styles.media}>
            <Gallery
              labels={{
                region: t('gallery.region'),
                previous: t('gallery.previous'),
                next: t('gallery.next'),
              }}
              slides={project.gallery.map((item, index) => ({
                key: `view-${item.view}`,
                label: registry(`galleryView.${item.view}`),
                content: (
                  <Image
                    className={styles.slideImage}
                    src={item.image.url}
                    alt={item.image.alt}
                    fill
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                  />
                ),
                thumbnail: (
                  <Image
                    className={styles.slideImage}
                    src={item.image.url}
                    alt=""
                    fill
                    sizes="88px"
                  />
                ),
              }))}
            />
          </div>
          <aside className={styles.summary}>
            <ProjectSummary project={project} completenessName={cheapest?.name ?? null} />
          </aside>
        </div>
      </Container>

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
          <FloorPlans plans={plans} roomNames={roomNames} />
        </Container>
      </Section>

      <Section id="offers" aria-labelledby="offers-title">
        <Container>
          <SectionHeading
            id="offers-title"
            title={t('completeness.title')}
            lead={t('completeness.lead')}
          />
          <Offers offers={offers} />
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
            <ProjectGrid projects={similar} />
          </Container>
        </Section>
      ) : null}

      {project.pricing === null ? null : (
        <ProjectActionBar
          priceLabel={t('price.from')}
          price={formatRubles(format, project.pricing.fromPrice)}
          action={common('actions.configure')}
          href={`/configurator/${project.slug}`}
        />
      )}
    </div>
  )
}
