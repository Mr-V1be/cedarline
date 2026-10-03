import { CaretRightIcon } from '@phosphor-icons/react/ssr'

import { Link } from '@/i18n/navigation'

import { Icon } from '../icon/icon'
import styles from './breadcrumbs.module.css'

export interface Crumb {
  readonly label: string
  /** Omitted for the current page. */
  readonly href?: string
}

export function Breadcrumbs({
  items,
  label,
}: {
  readonly items: readonly Crumb[]
  readonly label: string
}) {
  return (
    <nav aria-label={label} className={styles.nav}>
      <ol className={styles.list}>
        {items.map((item, index) => (
          <li key={item.label} className={styles.item}>
            {index > 0 ? (
              <Icon glyph={CaretRightIcon} size="s" className={styles.separator} />
            ) : null}
            {item.href === undefined ? (
              <span aria-current="page" className={styles.current} title={item.label}>
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className={styles.link}>
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
