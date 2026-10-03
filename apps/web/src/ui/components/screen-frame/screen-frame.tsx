import type { ReactNode } from 'react'

import styles from './screen-frame.module.css'

/**
 * A real screen of the product in a light browser frame: a window bar above the picture, so a
 * screenshot reads as an application rather than as a photo.
 */
export function ScreenFrame({
  children,
  className,
}: {
  readonly children: ReactNode
  readonly className?: string
}) {
  return (
    <figure className={[styles.frame, className].filter(Boolean).join(' ')}>
      <span className={styles.bar} aria-hidden>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </span>
      <div className={styles.screen}>{children}</div>
    </figure>
  )
}
