import type { Icon as PhosphorIcon } from '@phosphor-icons/react'

import styles from './icon.module.css'

/** One icon set (Phosphor), one weight, three sizes from the tokens. */
export const ICON_WEIGHT = 'light'

export type IconGlyph = PhosphorIcon
export type IconSize = 's' | 'm' | 'l'

interface IconProps {
  readonly glyph: IconGlyph
  readonly size?: IconSize
  readonly className?: string
}

export function Icon({ glyph: Glyph, size = 'm', className }: IconProps) {
  const classes = [styles.icon, styles[size], className].filter(Boolean).join(' ')
  return <Glyph weight={ICON_WEIGHT} className={classes} aria-hidden focusable={false} />
}
