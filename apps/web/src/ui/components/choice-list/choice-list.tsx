'use client'

import { CheckIcon, LockSimpleIcon } from '@phosphor-icons/react/ssr'
import { useId, type ReactNode } from 'react'

import { Icon } from '../icon/icon'
import styles from './choice-list.module.css'

export interface ChoiceItem<T extends string> {
  readonly value: T
  readonly label: string
  /** Secondary line under the label. */
  readonly description?: string
  /** Right-aligned figure: a price change, a size. */
  readonly meta?: string
  /** Visual before the label: a colour swatch, a small drawing. */
  readonly leading?: ReactNode
  /** Why the item cannot be chosen; the item is disabled when set. */
  readonly blockedReason?: string
}

interface ChoiceListProps<T extends string> {
  readonly legend: string
  readonly name: string
  /** One of many (radio) or several of many (checkbox). */
  readonly multiple?: boolean
  readonly items: readonly ChoiceItem<T>[]
  readonly selected: readonly T[]
  readonly onToggle: (value: T) => void
  readonly hideLegend?: boolean
  /** Label of the blocked state for assistive technology, e.g. «Unavailable». */
  readonly blockedLabel: string
}

/**
 * A list of options where each one carries what matters for the choice: a price change, a
 * swatch, or the reason it is blocked. Native radios or checkboxes inside: keyboard, screen
 * readers and forms work as the platform intends.
 */
export function ChoiceList<T extends string>({
  legend,
  name,
  multiple = false,
  items,
  selected,
  onToggle,
  hideLegend = false,
  blockedLabel,
}: ChoiceListProps<T>) {
  const id = useId()
  return (
    <fieldset className={styles.list}>
      <legend className={hideLegend ? 'visually-hidden' : styles.legend}>{legend}</legend>
      {items.map((item, index) => {
        const blocked = item.blockedReason !== undefined
        const checked = selected.includes(item.value)
        const describedBy = `${id}-${index}`
        return (
          <label
            key={item.value}
            className={[styles.item, blocked ? styles.blocked : undefined]
              .filter(Boolean)
              .join(' ')}
          >
            <input
              className={`${styles.input} visually-hidden`}
              type={multiple ? 'checkbox' : 'radio'}
              name={name}
              value={item.value}
              checked={checked}
              disabled={blocked}
              aria-describedby={
                item.description !== undefined || blocked || item.meta !== undefined
                  ? describedBy
                  : undefined
              }
              onChange={() => {
                onToggle(item.value)
              }}
            />
            {multiple ? (
              <span className={styles.box} aria-hidden>
                <Icon glyph={CheckIcon} size="s" />
              </span>
            ) : (
              <span className={styles.dot} aria-hidden />
            )}
            {item.leading === undefined ? null : (
              <span className={styles.leading} aria-hidden>
                {item.leading}
              </span>
            )}
            <span className={styles.text}>
              <span className={styles.label}>{item.label}</span>
              <span id={describedBy} className={styles.details}>
                {item.description === undefined ? null : (
                  <span className={styles.description}>{item.description}</span>
                )}
                {blocked ? (
                  <span className={styles.reason}>
                    <Icon glyph={LockSimpleIcon} size="s" className={styles.lock} />
                    <span className="visually-hidden">{blockedLabel}: </span>
                    {item.blockedReason}
                  </span>
                ) : null}
                {item.meta === undefined || blocked ? null : (
                  <span className="visually-hidden">{item.meta}</span>
                )}
              </span>
            </span>
            {item.meta === undefined || blocked ? null : (
              <span className={styles.meta} aria-hidden>
                {item.meta}
              </span>
            )}
          </label>
        )
      })}
    </fieldset>
  )
}
