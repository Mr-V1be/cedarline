import { Skeleton } from '@/ui/components/skeleton/skeleton'

import styles from './catalog-browser.module.css'
import { ProjectGridSkeleton } from './project-grid-skeleton'

const FILTER_PLACEHOLDERS = 5

/** The catalog frame while results load: same sidebar, toolbar and grid as the real page. */
export function CatalogSkeleton() {
  return (
    <div className={styles.browser} aria-hidden>
      <div className={styles.sidebar}>
        <Skeleton shape="line" style={{ width: '40%', height: '1.6em' }} />
        <div className={styles.fields}>
          {Array.from({ length: FILTER_PLACEHOLDERS }, (_, index) => (
            <Skeleton key={index} style={{ height: 'var(--control-height)' }} />
          ))}
        </div>
      </div>
      <div className={styles.results}>
        <div className={styles.toolbar}>
          <Skeleton shape="line" style={{ width: '6rem' }} />
          <Skeleton style={{ width: '12rem', height: 'var(--control-height)' }} />
        </div>
        <ProjectGridSkeleton />
      </div>
    </div>
  )
}
