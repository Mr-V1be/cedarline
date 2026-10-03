import { Container } from '@/ui/components/layout/container'
import { Skeleton } from '@/ui/components/skeleton/skeleton'

import styles from './calculator.module.css'

const FIELDS = 5

export default function CalculatorLoading() {
  return (
    <Container className={styles.page}>
      <header className={styles.header}>
        <Skeleton shape="line" style={{ width: 'min(480px, 85%)', height: '3rem' }} />
        <Skeleton shape="line" style={{ width: 'min(520px, 90%)' }} />
      </header>
      <div className={styles.loadingLayout}>
        <div className={styles.loadingForm}>
          {Array.from({ length: FIELDS }, (_, index) => (
            <Skeleton key={index} style={{ height: 64 }} />
          ))}
        </div>
        <Skeleton style={{ height: 460, borderRadius: 'var(--radius-l)' }} />
      </div>
    </Container>
  )
}
