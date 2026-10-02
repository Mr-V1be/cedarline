import type { ComponentProps, ReactNode } from 'react'

import styles from './layout.module.css'

interface ContainerProps {
  readonly children: ReactNode
  readonly className?: string
}

/** Content column of the page grid: full width up to the container size, with gutters. */
export function Container({ children, className }: ContainerProps) {
  return <div className={[styles.container, className].filter(Boolean).join(' ')}>{children}</div>
}

export type SectionTone = 'paper' | 'sunken' | 'pine'

type SectionProps = {
  readonly as?: 'section' | 'div' | 'aside'
  readonly tone?: SectionTone
  readonly children: ReactNode
  readonly className?: string
} & Omit<ComponentProps<'section'>, 'children' | 'ref'>

/** Full-bleed band with the shared vertical rhythm; the background spans the viewport. */
export function Section({
  as: Element = 'section',
  tone = 'paper',
  children,
  className,
  ...rest
}: SectionProps) {
  return (
    <Element
      className={[styles.section, styles[tone], className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </Element>
  )
}
