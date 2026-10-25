import { CheckIcon } from '@phosphor-icons/react/ssr'
import { getTranslations } from 'next-intl/server'

import { Icon } from '@/ui/components/icon/icon'

import type { CompletenessOffer } from '../application/offers'
import { createPriceFormatter } from '../application/price-formatter'
import type { DisplayCurrency } from '../domain/exchange-rate'
import styles from './offers.module.css'

interface OffersProps {
  readonly offers: readonly CompletenessOffer[]
  /** The visitor's currency. */
  readonly currency: DisplayCurrency
}

/** Completeness levels side by side: what each adds is visible by reading across. */
export async function Offers({ offers, currency }: OffersProps) {
  const [t, units] = await Promise.all([
    getTranslations('project'),
    getTranslations('common.units'),
  ])
  const prices = createPriceFormatter(currency)
  return (
    <div className={styles.offers}>
      {offers.map((offer) => (
        <section key={offer.key} className={styles.offer} aria-labelledby={`offer-${offer.key}`}>
          <h3 id={`offer-${offer.key}`} className={styles.name}>
            {offer.name}
          </h3>
          <p className={styles.total}>{prices.format(offer.total, 'exact')}</p>
          <p className={styles.duration}>
            {t('price.duration')}: {units('weeks', { count: offer.schedule.totalWeeks })}
          </p>
          <h4 className={styles.includes}>{t('completeness.includes')}</h4>
          <ul className={styles.sections}>
            {offer.sections.map((section) => (
              <li key={section.key} className={styles.section}>
                <Icon glyph={CheckIcon} size="s" className={styles.check} />
                <span className={styles.sectionName}>{section.name}</span>
                <span className={styles.subtotal}>{prices.format(section.subtotal, 'exact')}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
