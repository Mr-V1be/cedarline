'use client'

import { WarningCircleIcon } from '@phosphor-icons/react/ssr'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

import { Button } from '@/ui/components/button/button'
import { Container } from '@/ui/components/layout/container'
import { StateMessage } from '@/ui/components/state/state-message'

export default function ErrorBoundary({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}) {
  const t = useTranslations('common')
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <Container>
      <StateMessage
        tone="error"
        glyph={WarningCircleIcon}
        title={t('states.errorTitle')}
        description={t('states.errorDescription')}
        action={<Button onClick={reset}>{t('actions.retry')}</Button>}
      />
    </Container>
  )
}
