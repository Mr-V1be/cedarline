'use client'

import { Link, usePathname } from '@/i18n/navigation'

import { SITE_NAVIGATION, type NavigationKey } from '../domain/navigation'
import styles from './site-header.module.css'

/** Section links; the section the visitor is in is marked as current. */
export function HeaderNav({
  labels,
  label,
}: {
  readonly labels: Record<NavigationKey, string>
  readonly label: string
}) {
  const pathname = usePathname()
  return (
    <nav aria-label={label}>
      <ul className={styles.navList}>
        {SITE_NAVIGATION.filter((item) => item.header).map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className={styles.navLink}
              aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
            >
              {labels[item.key]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
