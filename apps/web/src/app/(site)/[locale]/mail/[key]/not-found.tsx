import { EnvelopeSimpleIcon } from '@phosphor-icons/react/ssr'
import { getTranslations } from 'next-intl/server'

import { DEMO_MAILBOX_RETENTION_DAYS } from '@/modules/mail/domain/mailbox'
import styles from '@/modules/mail/ui/letter.module.css'
import { ButtonLink } from '@/ui/components/button/button'
import { Container } from '@/ui/components/layout/container'
import { StateMessage } from '@/ui/components/state/state-message'

export default async function LetterNotFound() {
  const t = await getTranslations('mailbox.notFound')
  return (
    <Container className={styles.page}>
      <StateMessage
        glyph={EnvelopeSimpleIcon}
        title={t('title')}
        description={t('description', { days: DEMO_MAILBOX_RETENTION_DAYS })}
        action={<ButtonLink href="/">{t('action')}</ButtonLink>}
      />
    </Container>
  )
}
