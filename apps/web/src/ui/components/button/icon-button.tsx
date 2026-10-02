import type { ComponentProps } from 'react'

import { Icon, type IconGlyph } from '../icon/icon'
import styles from './button.module.css'
import iconStyles from './icon-button.module.css'

type IconButtonProps = Omit<ComponentProps<'button'>, 'children' | 'aria-label'> & {
  readonly glyph: IconGlyph
  /** Required: the button has no visible text. Also shown as a tooltip. */
  readonly label: string
}

export function IconButton({ glyph, label, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={[styles.button, styles.quiet, iconStyles.iconButton, className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <Icon glyph={glyph} size="m" />
    </button>
  )
}
