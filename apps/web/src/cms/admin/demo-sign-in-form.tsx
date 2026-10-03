'use client'

import { Button } from '@payloadcms/ui'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { DEMO_SESSION_IDLE, type DemoSessionAction } from '@/modules/demo/ui/demo-session-state'

interface DemoSignInFormProps {
  readonly action: DemoSessionAction
  readonly roles: readonly { readonly role: string; readonly label: string }[]
  readonly copy: {
    readonly title: string
    readonly lead: string
    readonly pending: string
    readonly limited: string
    readonly unavailable: string
  }
}

function RoleButtons({
  roles,
  pending: pendingLabel,
}: {
  readonly roles: DemoSignInFormProps['roles']
  readonly pending: string
}) {
  const { pending, data } = useFormStatus()
  const chosen = data?.get('role')
  return (
    <div className="demo-sign-in__roles">
      {roles.map(({ role, label }) => (
        <Button
          key={role}
          type="submit"
          extraButtonProps={{ name: 'role', value: role }}
          buttonStyle="secondary"
          size="medium"
          disabled={pending}
          margin={false}
        >
          {pending && chosen === role ? pendingLabel : label}
        </Button>
      ))}
    </div>
  )
}

/** One-click sign-in buttons on the CMS sign-in screen of a demo stand. */
export function DemoSignInForm({ action, roles, copy }: DemoSignInFormProps) {
  const [state, formAction] = useActionState(action, DEMO_SESSION_IDLE)
  return (
    <form action={formAction} className="demo-sign-in">
      <p className="demo-sign-in__title">{copy.title}</p>
      <p className="demo-sign-in__lead">{copy.lead}</p>
      <RoleButtons roles={roles} pending={copy.pending} />
      {state.error === null ? null : (
        <p className="demo-sign-in__error" role="alert">
          {state.error === 'limited' ? copy.limited : copy.unavailable}
        </p>
      )}
    </form>
  )
}
