import type { CSSProperties } from 'react'

import styles from './skeleton.module.css'

interface SkeletonProps {
  readonly shape?: 'block' | 'line'
  /** Width/height or aspect ratio of the content it stands for, so nothing jumps on load. */
  readonly style?: CSSProperties
  readonly className?: string
}

export function Skeleton({ shape = 'block', style, className }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={[styles.skeleton, styles[shape], className].filter(Boolean).join(' ')}
      style={style}
    />
  )
}
