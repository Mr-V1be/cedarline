'use client'

import '@/ui/tokens/tokens.css'
import '@/ui/tokens/base.css'

import { WarningCircleIcon } from '@phosphor-icons/react/ssr'
import { useEffect } from 'react'

import enCommon from '@/i18n/messages/en/common.json'
import ruCommon from '@/i18n/messages/ru/common.json'
import { Button } from '@/ui/components/button/button'
import { StateMessage } from '@/ui/components/state/state-message'

import styles from './global-error.module.css'

/**
 * Last-resort boundary for failures in a root layout (for example, the database is
 * unreachable), where the translation provider is not available: the language is taken from
 * the address, as the router would.
 */
export default function GlobalError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])
  const english = typeof window !== 'undefined' && /^\/en(\/|$)/.test(window.location.pathname)
  const common = english ? enCommon : ruCommon
  return (
    <html lang={english ? 'en' : 'ru'}>
      <body className={styles.body}>
        <main className={styles.main}>
          <StateMessage
            tone="error"
            glyph={WarningCircleIcon}
            title={common.states.errorTitle}
            description={common.states.errorDescription}
            action={<Button onClick={reset}>{common.actions.retry}</Button>}
          />
        </main>
      </body>
    </html>
  )
}
