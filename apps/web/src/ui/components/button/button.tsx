import type { ComponentProps, ReactNode } from 'react'

import { Link } from '@/i18n/navigation'

import { Icon, type IconGlyph } from '../icon/icon'
import { LinkPending } from '../link-pending/link-pending'
import styles from './button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'inverse'

interface ButtonLook {
  readonly variant?: ButtonVariant
  readonly icon?: IconGlyph
  readonly iconPosition?: 'start' | 'end'
  readonly stretch?: boolean
  readonly children: ReactNode
}

const classNameFor = (
  { variant = 'primary', stretch = false }: Pick<ButtonLook, 'variant' | 'stretch'>,
  extra?: string,
) =>
  [styles.button, styles[variant], stretch ? styles.stretch : undefined, extra]
    .filter(Boolean)
    .join(' ')

function Content({
  icon,
  iconPosition = 'start',
  children,
}: Pick<ButtonLook, 'icon' | 'iconPosition' | 'children'>) {
  const glyph = icon === undefined ? null : <Icon glyph={icon} size="m" />
  return (
    <>
      {iconPosition === 'start' ? glyph : null}
      <span className={styles.label}>{children}</span>
      {iconPosition === 'end' ? glyph : null}
    </>
  )
}

type ButtonProps = ButtonLook & Omit<ComponentProps<'button'>, 'children'>

export function Button({
  variant,
  icon,
  iconPosition,
  stretch,
  children,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={classNameFor({ variant, stretch }, className)} {...rest}>
      <Content icon={icon} iconPosition={iconPosition}>
        {children}
      </Content>
    </button>
  )
}

type ButtonLinkProps = ButtonLook & Omit<ComponentProps<typeof Link>, 'children'>

/** Navigation styled as a button: same look, real link semantics. */
export function ButtonLink({
  variant,
  icon,
  iconPosition,
  stretch,
  children,
  className,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={classNameFor({ variant, stretch }, className)} {...rest}>
      <Content icon={icon} iconPosition={iconPosition}>
        {children}
      </Content>
      <LinkPending />
    </Link>
  )
}

type ButtonAnchorProps = ButtonLook & Omit<ComponentProps<'a'>, 'children'>

/** A plain anchor styled as a button, for files and other non-page addresses. */
export function ButtonAnchor({
  variant,
  icon,
  iconPosition,
  stretch,
  children,
  className,
  ...rest
}: ButtonAnchorProps) {
  return (
    <a className={classNameFor({ variant, stretch }, className)} {...rest}>
      <Content icon={icon} iconPosition={iconPosition}>
        {children}
      </Content>
    </a>
  )
}
