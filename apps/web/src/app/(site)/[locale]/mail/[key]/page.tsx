import { EnvelopeSimpleIcon, FileArrowDownIcon } from '@phosphor-icons/react/ssr'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFormatter, getTranslations } from 'next-intl/server'

import { getServices } from '@/composition/services'
import type { Locale } from '@/i18n/locales'
import { DEMO_MAILBOX_RETENTION_DAYS } from '@/modules/mail/domain/mailbox'
import { LetterFrame } from '@/modules/mail/ui/letter-frame'
import styles from '@/modules/mail/ui/letter.module.css'
import { ButtonAnchor } from '@/ui/components/button/button'
import { Icon } from '@/ui/components/icon/icon'
import { Container } from '@/ui/components/layout/container'

export const dynamic = 'force-dynamic'

interface LetterPageProps {
  readonly params: Promise<{ locale: Locale; key: string }>
}

export async function generateMetadata({ params }: LetterPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'mailbox.meta' })
  // A private letter: never indexed, never sent as a referrer.
  return { title: t('title'), robots: { index: false, follow: false }, referrer: 'no-referrer' }
}

/** A letter from the demo mailbox, opened by its unguessable key. */
export default async function LetterPage({ params }: LetterPageProps) {
  const { locale, key } = await params
  const [services, t, format] = await Promise.all([
    getServices(locale),
    getTranslations('mailbox'),
    getFormatter(),
  ])
  const letter = await services.mailbox.open(key)
  if (letter === null) notFound()

  return (
    <Container className={styles.page}>
      <p className={styles.notice}>
        <Icon glyph={EnvelopeSimpleIcon} />
        <span>{t('notice', { to: letter.to, days: DEMO_MAILBOX_RETENTION_DAYS })}</span>
      </p>
      <h1 className={styles.subject}>{letter.subject}</h1>
      <dl className={styles.meta}>
        <div>
          <dt>{t('from')}</dt>
          <dd>{letter.from}</dd>
        </div>
        <div>
          <dt>{t('to')}</dt>
          <dd>{letter.to}</dd>
        </div>
        <div>
          <dt>{t('sent')}</dt>
          <dd>{format.dateTime(letter.sentAt, { dateStyle: 'long', timeStyle: 'short' })}</dd>
        </div>
      </dl>
      {letter.attachments.length === 0 ? null : (
        <section aria-label={t('attachments')}>
          <ul className={styles.attachments}>
            {letter.attachments.map((attachment, index) => (
              <li key={attachment.filename}>
                <ButtonAnchor
                  href={`/files/mail/${key}/${index}`}
                  download={attachment.filename}
                  variant="secondary"
                  icon={FileArrowDownIcon}
                >
                  {attachment.filename}{' '}
                  <span className={styles.size}>
                    {format.number(attachment.size / 1024, { maximumFractionDigits: 0 })} KB
                  </span>
                </ButtonAnchor>
              </li>
            ))}
          </ul>
        </section>
      )}
      <LetterFrame html={letter.html} title={t('body')} />
    </Container>
  )
}
