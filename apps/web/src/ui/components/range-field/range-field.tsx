'use client'

import { useId, type CSSProperties } from 'react'

import styles from './range-field.module.css'

interface RangeFieldProps {
  readonly label: string
  readonly value: number
  readonly min: number
  readonly max: number
  readonly step?: number
  /** The value as people read it («30 % · 1 440 000 ₽»), shown and announced. */
  readonly valueText: string
  /** Bounds as people read them, under the track. */
  readonly minText?: string
  readonly maxText?: string
  readonly onChange: (value: number) => void
}

/** A slider with its current value spelled out: down payments, terms, any bounded amount. */
export function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  valueText,
  minText,
  maxText,
  onChange,
}: RangeFieldProps) {
  const id = useId()
  const filled = max === min ? 100 : ((value - min) / (max - min)) * 100
  return (
    <div className={styles.field}>
      <div className={styles.head}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        <output htmlFor={id} className={styles.value}>
          {valueText}
        </output>
      </div>
      <input
        id={id}
        className={styles.range}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText}
        style={{ '--filled': `${filled}%` } as CSSProperties}
        onChange={(event) => {
          onChange(Number(event.target.value))
        }}
      />
      {minText === undefined && maxText === undefined ? null : (
        <div className={styles.bounds} aria-hidden>
          <span>{minText}</span>
          <span>{maxText}</span>
        </div>
      )}
    </div>
  )
}
