import { Container } from '@/ui/components/layout/container'
import { Skeleton } from '@/ui/components/skeleton/skeleton'

import styles from './loading.module.css'

/** Same two-column frame as the project page: gallery and summary. */
export default function ProjectLoading() {
  return (
    <Container className={styles.frame}>
      <Skeleton shape="line" style={{ width: '12rem' }} />
      <div className={styles.hero}>
        <Skeleton className={styles.media} />
        <div className={styles.summary}>
          <Skeleton shape="line" style={{ width: '30%' }} />
          <Skeleton shape="line" style={{ width: '70%', height: '2.5em' }} />
          <Skeleton shape="line" style={{ width: '90%' }} />
          <Skeleton className={styles.price} />
        </div>
      </div>
    </Container>
  )
}
