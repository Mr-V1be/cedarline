'use client'

import type { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

import styles from './pending-fieldset.module.css'

/**
 * Groups the controls of a form action and disables them all while it runs, so a second click
 * on another submit button cannot start a parallel submission.
 */
export function PendingFieldset({
  children,
  className,
}: {
  readonly children: ReactNode
  readonly className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <fieldset
      className={[styles.fieldset, className].filter(Boolean).join(' ')}
      disabled={pending}
      aria-busy={pending}
    >
      {children}
    </fieldset>
  )
}
