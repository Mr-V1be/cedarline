import { Container } from '@/ui/components/layout/container'
import { Skeleton } from '@/ui/components/skeleton/skeleton'

import styles from './articles.module.css'

const CARDS = 6

export default function ArticlesLoading() {
  return (
    <Container className={styles.page}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <Skeleton shape="line" style={{ width: 'min(320px, 70%)', height: '3rem' }} />
          <Skeleton shape="line" style={{ width: 'min(480px, 90%)' }} />
        </div>
        <Skeleton style={{ height: 'var(--control-height)' }} />
      </header>
      <ul className={styles.grid}>
        {Array.from({ length: CARDS }, (_, index) => (
          <li key={index} className={styles.skeletonCard}>
            <Skeleton style={{ aspectRatio: '16 / 11', borderRadius: 'var(--radius-l)' }} />
            <Skeleton shape="line" style={{ width: '40%' }} />
            <Skeleton shape="line" style={{ width: '90%', height: '1.5rem' }} />
            <Skeleton shape="line" style={{ width: '75%' }} />
          </li>
        ))}
      </ul>
    </Container>
  )
}
