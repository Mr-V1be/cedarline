import { CubeIcon } from '@phosphor-icons/react/ssr'

import { ButtonLink } from '@/ui/components/button/button'

import styles from './project-action-bar.module.css'

/** Phones: price and the page's action stay in the thumb zone while scrolling. */
export function ProjectActionBar({
  price,
  priceLabel,
  action,
  href,
}: {
  readonly price: string
  readonly priceLabel: string
  readonly action: string
  readonly href: string
}) {
  return (
    <div className={styles.bar}>
      <p className={styles.price}>
        <span className={styles.label}>{priceLabel}</span>
        <span className={styles.value}>{price}</span>
      </p>
      <ButtonLink href={href} icon={CubeIcon}>
        {action}
      </ButtonLink>
    </div>
  )
}
