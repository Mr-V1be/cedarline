import { CatalogSkeleton } from '@/modules/catalog/ui/catalog-skeleton'
import { Container } from '@/ui/components/layout/container'
import { Skeleton } from '@/ui/components/skeleton/skeleton'

import styles from './catalog.module.css'

export default function CatalogLoading() {
  return (
    <Container className={styles.page}>
      <header className={styles.header}>
        <Skeleton className={styles.skeletonTitle} />
      </header>
      <CatalogSkeleton />
    </Container>
  )
}
