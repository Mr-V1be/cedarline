import { Link } from '@/i18n/navigation'

import styles from './logo.module.css'

/** Wordmark with a gable-and-ridge mark drawn in the line weight of the site's drawings. */
/** Links home; the visible brand name is the link's accessible name. */
export function Logo({ name }: { readonly name: string }) {
  return (
    <Link href="/" className={styles.logo}>
      <svg className={styles.mark} viewBox="0 0 32 32" aria-hidden focusable="false">
        <path
          d="M4 15 16 5l12 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M8 13v14h16V13" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M16 11v16M12 17l4-3 4 3M11.5 22l4.5-3.5 4.5 3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
        />
      </svg>
      <span className={styles.name}>{name}</span>
    </Link>
  )
}
