import {
  BathtubIcon,
  BedIcon,
  ArrowsOutIcon,
  CubeIcon,
  RulerIcon,
  StairsIcon,
  ArrowLineUpIcon,
  PlantIcon,
} from '@phosphor-icons/react/ssr'
import { Money } from '@cedarline/pricing'
import { getTranslations } from 'next-intl/server'

import { createPriceFormatter } from '@/modules/pricing/application/price-formatter'
import type { DisplayCurrency } from '@/modules/pricing/domain/exchange-rate'
import { ButtonLink } from '@/ui/components/button/button'
import { Facts, type Fact } from '@/ui/components/facts/facts'

import type { ProjectSummary as Project } from '../domain/project'
import styles from './project-summary.module.css'

interface ProjectSummaryProps {
  readonly project: Project
  readonly completenessName: string | null
  /** The visitor's currency. */
  readonly currency: DisplayCurrency
}

/** Name, the numbers people compare, the price and the one action of the page. */
export async function ProjectSummary({ project, completenessName, currency }: ProjectSummaryProps) {
  const [t, common, registry] = await Promise.all([
    getTranslations('project'),
    getTranslations('common'),
    getTranslations('registry'),
  ])
  const { metrics, pricing } = project
  const storeyKey = metrics.storeyType as '1'
  const facts: Fact[] = [
    {
      key: 'area',
      label: t('facts.area'),
      value: common('units.area', { value: metrics.totalArea }),
      glyph: RulerIcon,
    },
    {
      key: 'dimensions',
      label: t('facts.dimensions'),
      value: common('units.dimensions', { width: metrics.width, depth: metrics.depth }),
      glyph: ArrowsOutIcon,
    },
    {
      key: 'storeys',
      label: t('facts.storeys'),
      value: registry.has(`storeyType.${storeyKey}`)
        ? registry(`storeyType.${storeyKey}`)
        : String(metrics.levels),
      glyph: StairsIcon,
    },
    ...(metrics.bedrooms > 0
      ? [
          {
            key: 'bedrooms',
            label: t('facts.bedrooms'),
            value: String(metrics.bedrooms),
            glyph: BedIcon,
          },
        ]
      : []),
    { key: 'wet', label: t('facts.wetZones'), value: String(metrics.wetZones), glyph: BathtubIcon },
    ...(metrics.terraceArea > 0
      ? [
          {
            key: 'terrace',
            label: t('facts.terrace'),
            value: common('units.area', { value: metrics.terraceArea }),
            glyph: PlantIcon,
          },
        ]
      : []),
    {
      key: 'ridge',
      label: t('facts.ridge'),
      value: common('units.metres', { value: metrics.ridgeHeight }),
      glyph: ArrowLineUpIcon,
    },
  ]
  return (
    <div className={styles.summary}>
      <p className={styles.type}>{project.type.title}</p>
      <h1 className={styles.title}>{project.title}</h1>
      <p className={styles.lead}>{project.summary}</p>
      <Facts items={facts} />
      {pricing === null ? null : (
        <div className={styles.price}>
          <p className={styles.priceLabel}>{t('price.from')}</p>
          <p className={styles.priceValue}>
            {createPriceFormatter(currency).format(Money.ofRubles(pricing.fromPrice), 'from')}
          </p>
          <p className={styles.priceNote}>
            {completenessName === null ? null : t('price.completeness', { name: completenessName })}
            <br />
            {t('price.duration')}: {common('units.weeks', { count: pricing.totalWeeks })}
          </p>
        </div>
      )}
      {/* Phones and tablets have the same action in the sticky bar at the bottom. */}
      <div className={styles.action}>
        <ButtonLink href={`/configurator/${project.slug}`} icon={CubeIcon} stretch>
          {common('actions.configure')}
        </ButtonLink>
      </div>
    </div>
  )
}
