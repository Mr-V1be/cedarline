'use client'

import { CaretDownIcon } from '@phosphor-icons/react/ssr'
import { useId, type ComponentProps } from 'react'

import { Icon } from '../icon/icon'
import styles from './select-field.module.css'

export interface SelectOption {
  readonly value: string
  readonly label: string
}

type SelectFieldProps = Omit<ComponentProps<'select'>, 'children' | 'id'> & {
  readonly label: string
  readonly options: readonly SelectOption[]
  /** Keeps the label for assistive technology when the context already names the field. */
  readonly hideLabel?: boolean
}

/**
 * Native select: the platform picker on phones, keyboard and screen reader support for free.
 * The label is linked by id rather than wrapping the control, so the accessible name is the
 * label alone and not the label plus every option.
 */
export function SelectField({
  label,
  options,
  hideLabel = false,
  className,
  ...rest
}: SelectFieldProps) {
  const id = useId()
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={hideLabel ? 'visually-hidden' : styles.label}>
        {label}
      </label>
      <span className={styles.control}>
        <select id={id} className={styles.select} {...rest}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon glyph={CaretDownIcon} size="s" className={styles.caret} />
      </span>
    </div>
  )
}
