import { Container } from '@/ui/components/layout/container'
import { Skeleton } from '@/ui/components/skeleton/skeleton'

import styles from './objects.module.css'

const ROWS = 6

export default function ObjectsLoading() {
  return (
    <Container className={styles.page}>
      <header className={styles.header}>
        <Skeleton shape="line" style={{ width: 'min(420px, 80%)', height: '3rem' }} />
        <Skeleton shape="line" style={{ width: 'min(560px, 90%)' }} />
      </header>
      <div className={styles.loadingLayout}>
        <Skeleton className={styles.loadingMap} />
        <div className={styles.loadingList}>
          {Array.from({ length: ROWS }, (_, index) => (
            <Skeleton key={index} style={{ height: 88 }} />
          ))}
        </div>
      </div>
    </Container>
  )
}
