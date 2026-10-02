'use client'

import { CheckIcon } from '@phosphor-icons/react/ssr'
import { useId, type ComponentProps } from 'react'

import { Icon } from '../icon/icon'
import styles from './checkbox-field.module.css'

type CheckboxFieldProps = Omit<ComponentProps<'input'>, 'type' | 'id'> & {
  readonly label: string
  readonly error?: string
}

/** A single checkbox with a label that may wrap (consents, agreements) and an inline error. */
export function CheckboxField({ label, error, className, ...rest }: CheckboxFieldProps) {
  const id = useId()
  const errorId = error === undefined ? undefined : `${id}-error`
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label className={styles.row} htmlFor={id}>
        <input
          {...rest}
          id={id}
          type="checkbox"
          className={`${styles.input} visually-hidden`}
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={errorId}
        />
        <span className={styles.box} aria-hidden>
          <Icon glyph={CheckIcon} size="s" />
        </span>
        <span className={styles.label}>{label}</span>
      </label>
      {error === undefined ? null : (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
