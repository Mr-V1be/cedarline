'use client'

import { QUANTITY_DRIVERS, isQuantityDriver } from '@kedrovnik/house'
import type { Estimate, Schedule } from '@kedrovnik/pricing'
import { CaretDownIcon } from '@phosphor-icons/react/ssr'
import { useFormatter, useTranslations } from 'next-intl'

import { toScheduleView } from '@/modules/pricing/application/offers'
import type { TariffNames } from '@/modules/pricing/ports/tariff-repository'
import { usePrices } from '@/modules/pricing/ui/prices'
import { ScheduleChart } from '@/modules/pricing/ui/schedule-chart'
import { Icon } from '@/ui/components/icon/icon'

import styles from './estimate-details.module.css'

interface EstimateDetailsProps {
  readonly estimate: Estimate
  readonly schedule: Schedule
  readonly names: TariffNames
  /** Heading level of the block inside its page or sheet. */
  readonly headingLevel?: 'h2' | 'h3'
}

/**
 * The estimate by sections with every line (quantity × unit price = amount) and the schedule
 * chart. Amounts are exact; nothing here is rounded for advertising.
 */
export function EstimateDetails({
  estimate,
  schedule,
  names,
  headingLevel: Heading = 'h3',
}: EstimateDetailsProps) {
  const t = useTranslations('configurator.estimate')
  const common = useTranslations('common')
  const registry = useTranslations('registry')
  const format = useFormatter()
  const prices = usePrices()
  const { rate } = prices.display
  const unitOf = (driver: string) =>
    isQuantityDriver(driver) ? registry(`quantityUnit.${QUANTITY_DRIVERS[driver].unit}`) : ''
  const view = toScheduleView(schedule, names)
  const weeksOf = (days: number) =>
    common('units.weeks', { count: Math.ceil(days / schedule.workingDaysPerWeek) })

  return (
    <div className={styles.estimate}>
      <Heading className={styles.heading}>{t('title')}</Heading>
      <ul className={styles.sections}>
        {estimate.sections.map((section) => (
          <li key={section.key}>
            <details className={styles.section}>
              <summary className={styles.summary}>
                <span className={styles.sectionName}>
                  <Icon glyph={CaretDownIcon} size="s" className={styles.caret} />
                  {names.sections[section.key] ?? section.key}
                </span>
                <span className={styles.amount}>{prices.format(section.subtotal, 'exact')}</span>
              </summary>
              <ul className={styles.lines}>
                {section.lines.map((line) => (
                  <li key={line.code} className={styles.line}>
                    <span className={styles.lineName}>{names.rates[line.code] ?? line.code}</span>
                    <span className={styles.lineMath}>
                      {t('line', {
                        quantity:
                          `${format.number(line.quantity, { maximumFractionDigits: 2 })} ${unitOf(line.driver)}`.trim(),
                        price: prices.format(line.unitPrice, 'unitPrice'),
                      })}
                    </span>
                    <span className={styles.amount}>{prices.format(line.amount, 'exact')}</span>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
      <p className={styles.total}>
        <span>{t('total')}</span>
        <strong>{prices.format(estimate.total, 'exact')}</strong>
      </p>

      <Heading className={styles.heading}>{t('schedule')}</Heading>
      <ul className={styles.phases}>
        {schedule.phases.map((phase) => (
          <li key={phase.key}>
            {t('phase', {
              name: names.phases[phase.key] ?? phase.key,
              weeks: weeksOf(phase.durationDays),
            })}
          </li>
        ))}
      </ul>
      <ScheduleChart
        schedule={view}
        labels={{
          axis: common('schedule.axis'),
          total: common('schedule.total'),
          totalValue: common('units.weeks', { count: schedule.totalWeeks }),
          range: (from, to) =>
            from === to
              ? common('schedule.weekSingle', { week: from })
              : common('schedule.weekRange', { from, to }),
        }}
      />
      <p className={styles.note}>
        {t('note')}
        {rate === null
          ? null
          : ` ${common('prices.converted', { date: format.dateTime(new Date(rate.setOn), { dateStyle: 'long' }) })}`}
      </p>
    </div>
  )
}
