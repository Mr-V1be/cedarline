import type { ReactNode } from 'react'

import styles from './section-heading.module.css'

interface SectionHeadingProps {
  readonly id?: string
  readonly title: string
  readonly lead?: string
  /** A quiet action aligned with the heading, e.g. a link to the full list. */
  readonly aside?: ReactNode
}

export function SectionHeading({ id, title, lead, aside }: SectionHeadingProps) {
  return (
    <header className={styles.heading}>
      <div className={styles.text}>
        <h2 id={id} className={styles.title}>
          {title}
        </h2>
        {lead === undefined ? null : <p className={styles.lead}>{lead}</p>}
      </div>
      {aside === undefined ? null : <div className={styles.aside}>{aside}</div>}
    </header>
  )
}
