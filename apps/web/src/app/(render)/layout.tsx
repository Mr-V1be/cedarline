import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import styles from './render.module.css'

export const metadata: Metadata = { robots: { index: false, follow: false } }

/** Bare document for still renders of the 3D scene: no chrome, transparent background. */
export default function RenderLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="ru">
      <body className={styles.body}>{children}</body>
    </html>
  )
}
