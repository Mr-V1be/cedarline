import { CompassIcon } from '@phosphor-icons/react/ssr'
import { getTranslations } from 'next-intl/server'

import { ButtonLink } from '@/ui/components/button/button'
import { Container } from '@/ui/components/layout/container'
import { StateMessage } from '@/ui/components/state/state-message'

export default async function NotFound() {
  const t = await getTranslations('common')
  return (
    <Container>
      <StateMessage
        glyph={CompassIcon}
        title={t('states.notFoundTitle')}
        description={t('states.notFoundDescription')}
        action={<ButtonLink href="/projects">{t('actions.toCatalog')}</ButtonLink>}
      />
    </Container>
  )
}
