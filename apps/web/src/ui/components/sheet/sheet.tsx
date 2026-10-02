'use client'

import { XIcon } from '@phosphor-icons/react/ssr'
import { useEffect, useId, useRef, type ReactNode } from 'react'

import { IconButton } from '../button/icon-button'
import styles from './sheet.module.css'

interface SheetProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly title: string
  readonly closeLabel: string
  readonly children: ReactNode
  /** Sticky actions in the thumb zone, e.g. «Show 7 projects». */
  readonly footer?: ReactNode
}

/**
 * Modal sheet on the native <dialog>: focus trap, Escape and the top layer come from the
 * platform. A bottom sheet on phones, a side panel from tablets up.
 */
export function Sheet({ open, onClose, title, closeLabel, children, footer }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const element = dialogRef.current
    if (element === null) return
    if (open && !element.open) element.showModal()
    if (!open && element.open) element.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={styles.sheet}
      aria-labelledby={titleId}
      // Light dismiss (backdrop click, Escape) is the platform's; we only mirror it in state.
      closedby="any"
      onClose={() => {
        if (open) onClose()
      }}
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <IconButton glyph={XIcon} label={closeLabel} onClick={onClose} />
        </header>
        <div className={styles.body}>{children}</div>
        {footer === undefined ? null : <footer className={styles.footer}>{footer}</footer>}
      </div>
    </dialog>
  )
}
