import { InfoIcon } from '@phosphor-icons/react/ssr'
import { getFormatter, getMessages, getTranslations } from 'next-intl/server'

import { interpolate } from '@/i18n/interpolate'
import { DEMO_MAILBOX_RETENTION_DAYS } from '@/modules/mail/domain/mailbox'
import { Icon } from '@/ui/components/icon/icon'
import { Container } from '@/ui/components/layout/container'

import type { SiteContent } from '../domain/site'
import styles from './privacy-policy.module.css'

/**
 * The personal data policy as a document: numbered sections with a table of contents. The text
 * lives in the translations; operator details come from the company settings.
 */
export async function PrivacyPolicy({ site }: { readonly site: SiteContent }) {
  const [t, messages, format] = await Promise.all([
    getTranslations('privacy'),
    getMessages(),
    getFormatter(),
  ])
  const values = {
    operator: site.legal.name,
    taxId: site.legal.taxId,
    registrationNumber: site.legal.registrationNumber,
    privacyEmail: site.legal.privacyEmail,
    address: site.address,
    mailboxDays: DEMO_MAILBOX_RETENTION_DAYS,
  }
  const sections = Object.entries(messages.privacy.sections)

  return (
    <Container className={styles.document}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.edition}>
          {t('edition', {
            date: format.dateTime(site.legal.privacyEdition, { dateStyle: 'long' }),
          })}
        </p>
        <p className={styles.demo}>
          <Icon glyph={InfoIcon} />
          <span>{t('demo')}</span>
        </p>
      </header>
      <nav className={styles.contents} aria-labelledby="privacy-contents">
        <h2 id="privacy-contents" className={styles.contentsTitle}>
          {t('contents')}
        </h2>
        <ol className={styles.contentsList}>
          {sections.map(([key, section]) => (
            <li key={key}>
              <a href={`#${key}`} className={styles.contentsLink}>
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className={styles.body}>
        {sections.map(([key, section], index) => (
          <section key={key} id={key} className={styles.section} aria-labelledby={`${key}-title`}>
            <h2 id={`${key}-title`} className={styles.sectionTitle}>
              <span className={styles.number}>{index + 1}</span>
              {section.title}
            </h2>
            <ol className={styles.points}>
              {Object.entries(section.paragraphs).map(([point, text]) => (
                <li key={point} className={styles.point}>
                  <span className={styles.pointNumber}>{`${index + 1}.${point}`}</span>
                  <p>{interpolate(text, values)}</p>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </Container>
  )
}
