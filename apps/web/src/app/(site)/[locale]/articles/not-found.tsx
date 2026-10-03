import { ArticleIcon } from '@phosphor-icons/react/ssr'
import { getTranslations } from 'next-intl/server'

import { ButtonLink } from '@/ui/components/button/button'
import { Container } from '@/ui/components/layout/container'
import { StateMessage } from '@/ui/components/state/state-message'

export default async function ArticleNotFound() {
  const t = await getTranslations('articles.notFound')
  return (
    <Container>
      <StateMessage
        glyph={ArticleIcon}
        title={t('title')}
        description={t('description')}
        action={<ButtonLink href="/articles">{t('action')}</ButtonLink>}
      />
    </Container>
  )
}
