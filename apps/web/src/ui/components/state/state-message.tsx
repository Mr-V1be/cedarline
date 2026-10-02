import type { ReactNode } from 'react'

import { Icon, type IconGlyph } from '../icon/icon'
import styles from './state-message.module.css'

interface StateMessageProps {
  readonly glyph: IconGlyph
  readonly title: string
  readonly description?: string
  /** The one action that moves the visitor on: reset filters, retry, go to the catalog. */
  readonly action?: ReactNode
  readonly tone?: 'neutral' | 'error'
}

/** Empty, error and no-access states share one layout: what happened and what to do. */
export function StateMessage({
  glyph,
  title,
  description,
  action,
  tone = 'neutral',
}: StateMessageProps) {
  return (
    <div className={styles.state} role={tone === 'error' ? 'alert' : 'status'}>
      <span className={[styles.mark, styles[tone]].join(' ')}>
        <Icon glyph={glyph} size="l" />
      </span>
      <p className={styles.title}>{title}</p>
      {description === undefined ? null : <p className={styles.description}>{description}</p>}
      {action === undefined ? null : <div className={styles.action}>{action}</div>}
    </div>
  )
}
