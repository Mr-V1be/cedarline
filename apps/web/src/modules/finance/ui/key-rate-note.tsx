'use client'

import { BankIcon } from '@phosphor-icons/react/ssr'
import { useFormatter, useTranslations } from 'next-intl'

import { Icon } from '@/ui/components/icon/icon'

import { basisPointsToPercent, type BasisPoints } from '../domain/key-rate'
import styles from './calculator.module.css'

/** The key rate as sent to the browser: dates as ISO strings. */
export interface KeyRateView {
  readonly rate: BasisPoints
  readonly effectiveFrom: string
  readonly fetchedAt: string
  readonly stale: boolean
}

/**
 * Which key rate the calculation uses, since when, and whether the source is answering; without
 * any rate, that only interest-free instalments are calculated.
 */
export function KeyRateNote({ keyRate }: { readonly keyRate: KeyRateView | null }) {
  const t = useTranslations('calculator')
  const format = useFormatter()
  if (keyRate === null) {
    return (
      <p className={`${styles.keyRate} ${styles.keyRateStale}`}>
        <Icon glyph={BankIcon} />
        <span>{t('keyRate.missingNote')}</span>
      </p>
    )
  }
  const day = (iso: string) => format.dateTime(new Date(iso), { dateStyle: 'long' })
  const rate = t('units.percent', { value: basisPointsToPercent(keyRate.rate) })
  return (
    <p className={keyRate.stale ? `${styles.keyRate} ${styles.keyRateStale}` : styles.keyRate}>
      <Icon glyph={BankIcon} />
      <span>
        {t('keyRate.current', { rate, date: day(keyRate.effectiveFrom) })}
        {' · '}
        {keyRate.stale
          ? t('keyRate.stale', { date: day(keyRate.fetchedAt) })
          : t('keyRate.updated', {
              date: format.dateTime(new Date(keyRate.fetchedAt), {
                dateStyle: 'medium',
                timeStyle: 'short',
              }),
            })}
      </span>
    </p>
  )
}
