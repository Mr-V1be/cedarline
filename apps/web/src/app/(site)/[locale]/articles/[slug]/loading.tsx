import { Container } from '@/ui/components/layout/container'
import { Skeleton } from '@/ui/components/skeleton/skeleton'

import styles from './article.module.css'

const LINES = 8

/** The body while it streams; the header and cover come with the layout. */
export default function ArticleLoading() {
  return (
    <Container className={styles.content}>
      <div className={styles.layout}>
        <div className={styles.loadingBody}>
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
