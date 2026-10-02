import { Skeleton } from '@/ui/components/skeleton/skeleton'

import styles from './project-grid.module.css'

const PLACEHOLDERS = 6

/** Same grid and card proportions as the results, so nothing moves when they arrive. */
export function ProjectGridSkeleton() {
  return (
    <ul className={styles.grid} aria-hidden>
      {Array.from({ length: PLACEHOLDERS }, (_, index) => (
        <li key={index} className={styles.skeletonCard}>
          <Skeleton className={styles.skeletonImage} />
          <Skeleton shape="line" style={{ width: '30%' }} />
          <Skeleton shape="line" style={{ width: '60%', height: '1.6em' }} />
          <Skeleton shape="line" style={{ width: '45%' }} />
        </li>
      ))}
    </ul>
  )
}
