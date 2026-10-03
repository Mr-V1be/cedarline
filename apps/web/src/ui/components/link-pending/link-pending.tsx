'use client'

import { useLinkStatus } from 'next/link'

import styles from './link-pending.module.css'

/**
 * A thin running line along the bottom of the link it sits in while the page it leads to is
 * loading. Pages that render in one piece have no skeleton, so this is the visitor's sign that
 * the tap was taken. Its parent must be positioned.
 */
export function LinkPending() {
  const { pending } = useLinkStatus()
  return <span className={styles.mark} data-pending={pending ? '' : undefined} aria-hidden />
}
