import type { ReactNode } from 'react'

import { Icon, type IconGlyph } from '../icon/icon'
import styles from './facts.module.css'

export interface Fact {
  readonly key: string
  readonly label: string
  readonly value: ReactNode
  readonly glyph?: IconGlyph
}

interface FactsProps {
  readonly items: readonly Fact[]
  readonly columns?: 2 | 3
  readonly className?: string
}

/** Label–value pairs as a definition list: characteristics, specifications, totals. */
export function Facts({ items, columns = 2, className }: FactsProps) {
  return (
    <dl
      className={[styles.facts, styles[`columns${columns}`], className].filter(Boolean).join(' ')}
    >
      {items.map((item) => (
        <div key={item.key} className={styles.fact}>
          <dt className={styles.label}>
            {item.glyph === undefined ? null : <Icon glyph={item.glyph} size="s" />}
            {item.label}
          </dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
