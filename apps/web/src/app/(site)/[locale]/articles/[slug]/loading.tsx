import { Container } from '@/ui/components/layout/container'
import { Skeleton } from '@/ui/components/skeleton/skeleton'

import styles from './article.module.css'

const LINES = 8

export default function ArticleLoading() {
  return (
    <Container className={styles.page}>
      <Skeleton shape="line" style={{ width: 'min(240px, 60%)' }} />
      <header className={styles.header}>
        <Skeleton shape="line" style={{ width: 'min(300px, 70%)' }} />
        <Skeleton shape="line" style={{ width: 'min(760px, 95%)', height: '3.5rem' }} />
        <Skeleton shape="line" style={{ width: 'min(620px, 90%)' }} />
      </header>
      <Skeleton className={styles.cover} />
      <div className={styles.layout}>
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {Array.from({ length: LINES }, (_, index) => (
            <Skeleton
              key={index}
              shape="line"
              style={{ width: index % 3 === 2 ? '70%' : '100%' }}
            />
          ))}
        </div>
      </div>
    </Container>
  )
}
