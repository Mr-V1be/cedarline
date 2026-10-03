'use client'

import type { ComponentProps } from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from './button'

type SubmitButtonProps = Omit<ComponentProps<typeof Button>, 'type'> & {
  /** Shown while the form is being submitted; the button stays disabled until it is done. */
  readonly pendingLabel: string
}

/** The submit button of a form action: says what is happening while the action runs. */
export function SubmitButton({ pendingLabel, children, disabled, ...rest }: SubmitButtonProps) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...rest}>
      {pending ? pendingLabel : children}
    </Button>
  )
}
