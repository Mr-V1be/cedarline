'use client'

import { useActionState, type ReactNode } from 'react'

import { PendingFieldset } from '@/ui/components/form/pending-fieldset'

import styles from './demo-access.module.css'
import {
  DEMO_SESSION_IDLE,
  type DemoSessionAction,
  type DemoSessionState,
} from './demo-session-state'

interface DemoSessionFormProps {
  readonly action: DemoSessionAction
  readonly role: string
  readonly errors: Record<NonNullable<DemoSessionState['error']>, string>
  readonly children: ReactNode
}

/**
 * Sign-in form of one demo role. Each stop is a submit button carrying its key, so the session
 * opens on that section; a refusal (limit, stand not in demo mode) is said under the form.
 */
export function DemoSessionForm({ action, role, errors, children }: DemoSessionFormProps) {
  const [state, formAction] = useActionState(action, DEMO_SESSION_IDLE)
  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="role" value={role} />
      <PendingFieldset className={styles.fieldset}>{children}</PendingFieldset>
      {state.error === null ? null : (
        <p className={styles.error} role="alert">
          {errors[state.error]}
        </p>
      )}
    </form>
  )
}
