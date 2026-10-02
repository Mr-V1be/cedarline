import { CheckIcon } from '@phosphor-icons/react/ssr'
import { getFormatter, getTranslations } from 'next-intl/server'

import { Icon } from '@/ui/components/icon/icon'

import type { CompletenessOffer } from '../application/offers'
import { formatRubles } from './money'
import styles from './offers.module.css'

/** Completeness levels side by side: what each adds is visible by reading across. */
export async function Offers({ offers }: { readonly offers: readonly CompletenessOffer[] }) {
  const [t, units, format] = await Promise.all([
    getTranslations('project'),
    getTranslations('common.units'),
    getFormatter(),
  ])
  return (
    <div className={styles.offers}>
      {offers.map((offer) => (
        <section key={offer.key} className={styles.offer} aria-labelledby={`offer-${offer.key}`}>
          <h3 id={`offer-${offer.key}`} className={styles.name}>
            {offer.name}
          </h3>
          <p className={styles.total}>{formatRubles(format, offer.total)}</p>
          <p className={styles.duration}>
            {t('price.duration')}: {units('weeks', { count: offer.schedule.totalWeeks })}
          </p>
          <h4 className={styles.includes}>{t('completeness.includes')}</h4>
          <ul className={styles.sections}>
            {offer.sections.map((section) => (
              <li key={section.key} className={styles.section}>
                <Icon glyph={CheckIcon} size="s" className={styles.check} />
                <span className={styles.sectionName}>{section.name}</span>
                <span className={styles.subtotal}>{formatRubles(format, section.subtotal)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
