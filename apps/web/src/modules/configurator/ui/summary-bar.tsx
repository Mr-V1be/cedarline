'use client'

import type { Quote } from '@kedrovnik/pricing'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { usePrices } from '@/modules/pricing/ui/prices'

import styles from './summary-bar.module.css'

interface SummaryBarProps {
  readonly quote: Quote
  readonly completeness: string
  /** The main action of the moment, next to the total. */
  readonly primary: ReactNode
  /** Quieter actions on a row of their own; desktops only. */
  readonly secondary?: ReactNode
}

/** The running total and the build time, with the actions of the moment next to them. */
export function SummaryBar({ quote, completeness, primary, secondary }: SummaryBarProps) {
  const t = useTranslations('configurator')
  const common = useTranslations('common')
  const prices = usePrices()
  return (
    <div className={styles.bar}>
      <dl className={styles.figures}>
        <div className={styles.figure}>
          <dt className={styles.label}>
            {completeness}
            <span className={styles.inlineWeeks}>
              {' · '}
              {common('units.weeks', { count: quote.schedule.totalWeeks })}
            </span>
          </dt>
          <dd className={styles.total} aria-live="polite">
            {prices.format(quote.estimate.total, 'exact')}
          </dd>
        </div>
        <div className={styles.figure}>
          <dt className={styles.label}>{t('summary.weeks')}</dt>
          <dd className={styles.weeks}>
            {common('units.weeks', { count: quote.schedule.totalWeeks })}
          </dd>
        </div>
      </dl>
      <div className={styles.primary}>{primary}</div>
      {secondary === undefined ? null : <div className={styles.secondary}>{secondary}</div>}
    </div>
  )
}
