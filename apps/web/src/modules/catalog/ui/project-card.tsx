import { BedIcon, HouseLineIcon, RulerIcon } from '@phosphor-icons/react/ssr'
import Image from 'next/image'
import { getFormatter, getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { formatRubles } from '@/modules/pricing/ui/money'
import { Icon } from '@/ui/components/icon/icon'

import type { ProjectSummary } from '../domain/project'
import styles from './project-card.module.css'

interface ProjectCardProps {
  readonly project: ProjectSummary
  readonly sizes: string
  readonly priority?: boolean
  readonly headingLevel?: 'h2' | 'h3'
}

/** Catalog entry: the render, the name and the three numbers people compare. */
export async function ProjectCard({
  project,
  sizes,
  priority = false,
  headingLevel: Heading = 'h3',
}: ProjectCardProps) {
  const [t, format] = await Promise.all([getTranslations('common'), getFormatter()])
  const { metrics, pricing } = project
  return (
    <article className={styles.card}>
      <div className={styles.media}>
        {project.cover === null ? (
          <div className={styles.placeholder}>
            <Icon glyph={HouseLineIcon} size="l" />
          </div>
        ) : (
          <Image
            className={styles.image}
            src={project.cover.url}
            alt={project.cover.alt}
            fill
            sizes={sizes}
            priority={priority}
          />
        )}
      </div>
      <div className={styles.body}>
        <p className={styles.type}>{project.type.title}</p>
        <Heading className={styles.title}>
          <Link href={`/projects/${project.slug}`} className={styles.link}>
            {project.title}
          </Link>
        </Heading>
        <ul className={styles.facts}>
          <li>
            <Icon glyph={RulerIcon} size="s" />
            {t('units.area', { value: metrics.totalArea })}
          </li>
          {metrics.bedrooms > 0 ? (
            <li>
              <Icon glyph={BedIcon} size="s" />
              {t('units.bedrooms', { count: metrics.bedrooms })}
            </li>
          ) : null}
        </ul>
        {pricing === null ? null : (
          <p className={styles.price}>
            {t('units.priceFrom', { price: formatRubles(format, pricing.fromPrice) })}
          </p>
        )}
      </div>
    </article>
  )
}
