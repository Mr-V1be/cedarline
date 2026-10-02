'use client'

import { useId } from 'react'

import styles from './switch.module.css'

interface SwitchProps {
  readonly label: string
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
  readonly description?: string
  readonly disabled?: boolean
}

/** On/off setting: a native checkbox with switch semantics and a label that toggles it. */
export function Switch({ label, checked, onChange, description, disabled = false }: SwitchProps) {
  const id = useId()
  return (
    <label className={styles.row}>
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {description === undefined ? null : (
          <span id={id} className={styles.description}>
            {description}
          </span>
        )}
      </span>
      <input
        className={`${styles.input} visually-hidden`}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        aria-describedby={description === undefined ? undefined : id}
        onChange={(event) => {
          onChange(event.target.checked)
        }}
      />
      <span className={styles.track} aria-hidden>
        <span className={styles.thumb} />
      </span>
    </label>
  )
}
