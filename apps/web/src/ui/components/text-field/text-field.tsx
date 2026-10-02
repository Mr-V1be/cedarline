'use client'

import { useId, type ComponentProps } from 'react'

import styles from './text-field.module.css'

interface FieldLook {
  readonly label: string
  readonly hint?: string
  /** Shown under the field and announced; marks the field invalid. */
  readonly error?: string
}

type InputProps = FieldLook & { readonly multiline?: false } & Omit<ComponentProps<'input'>, 'id'>
type AreaProps = FieldLook & { readonly multiline: true } & Omit<ComponentProps<'textarea'>, 'id'>

/** Labelled text input or text area with a hint and an inline error message. */
export function TextField(props: InputProps | AreaProps) {
  const id = useId()
  const { label, hint, error, className, multiline, ...rest } = props
  const hintId = hint === undefined ? undefined : `${id}-hint`
  const errorId = error === undefined ? undefined : `${id}-error`
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined
  const common = {
    id,
    className: [styles.control, multiline === true ? styles.area : undefined]
      .filter(Boolean)
      .join(' '),
    'aria-invalid': error === undefined ? undefined : true,
    'aria-describedby': describedBy,
  }
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {multiline === true ? (
        <textarea {...(rest as Omit<ComponentProps<'textarea'>, 'id'>)} {...common} />
      ) : (
        <input {...(rest as Omit<ComponentProps<'input'>, 'id'>)} {...common} />
      )}
      {error === undefined ? null : (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
      {hint === undefined ? null : (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  )
}
