import { Container } from '@/ui/components/layout/container'
import { Skeleton } from '@/ui/components/skeleton/skeleton'

import styles from './loading.module.css'

/**
 * The sections below the hero while they stream: the 3D model's heading and stage. The hero
 * itself comes with the layout.
 */
export default function ProjectLoading() {
  return (
    <Container className={styles.frame}>
      <Skeleton shape="line" style={{ width: 'min(16rem, 60%)', height: '2.5em' }} />
      <Skeleton className={styles.stage} />
    </Container>
  )
}
