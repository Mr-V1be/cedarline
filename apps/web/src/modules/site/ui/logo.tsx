import { Link } from '@/i18n/navigation'
import { BRAND_NAME } from '@/ui/brand/brand'
import { BrandMark } from '@/ui/brand/brand-mark'

import styles from './logo.module.css'

/** The wordmark: the mark and the name, linking home; the name is the link's accessible name. */
export function Logo() {
  return (
    <Link href="/" className={styles.logo}>
      <BrandMark className={styles.mark} />
      <span className={styles.name}>{BRAND_NAME}</span>
    </Link>
  )
}
