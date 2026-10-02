import { CaretDownIcon } from '@phosphor-icons/react/ssr'
import type { ComponentProps } from 'react'

import { Icon } from '../icon/icon'
import styles from './select-field.module.css'

export interface SelectOption {
  readonly value: string
  readonly label: string
}

type SelectFieldProps = Omit<ComponentProps<'select'>, 'children'> & {
  readonly label: string
  readonly options: readonly SelectOption[]
  /** Keeps the label for assistive technology when the context already names the field. */
  readonly hideLabel?: boolean
}

/** Native select: the platform picker on phones, keyboard and screen reader support for free. */
export function SelectField({
  label,
  options,
  hideLabel = false,
  className,
  ...rest
}: SelectFieldProps) {
  return (
    <label className={[styles.field, className].filter(Boolean).join(' ')}>
      <span className={hideLabel ? 'visually-hidden' : styles.label}>{label}</span>
      <span className={styles.control}>
        <select className={styles.select} {...rest}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon glyph={CaretDownIcon} size="s" className={styles.caret} />
      </span>
    </label>
  )
}
