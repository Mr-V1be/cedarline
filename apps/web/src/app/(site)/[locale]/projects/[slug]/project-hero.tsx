import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import type { ProjectOverview } from '@/modules/catalog/application/project-overview'
import { ProjectSummary } from '@/modules/catalog/ui/project-summary'
import { Breadcrumbs } from '@/ui/components/breadcrumbs/breadcrumbs'
import { Gallery } from '@/ui/components/gallery/gallery'
import { Container } from '@/ui/components/layout/container'

import styles from './project.module.css'

/**
 * The top of a project page: breadcrumbs, the gallery and the summary with the price. The layout
 * renders it from data it has already loaded, so the largest image is in the first paint and
 * only the sections below wait behind the loading skeleton.
 */
export async function ProjectHero({ overview }: { readonly overview: ProjectOverview }) {
  const { project, offers } = overview
  const [t, registry] = await Promise.all([getTranslations('project'), getTranslations('registry')])
  const cheapest = offers.find((offer) => offer.key === project.pricing?.fromCompleteness) ?? null

  return (
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
  )
}
