'use client'

import { ListIcon } from '@phosphor-icons/react/ssr'
import { useEffect, useState } from 'react'

import { Link, usePathname } from '@/i18n/navigation'
import { ButtonLink } from '@/ui/components/button/button'
import { IconButton } from '@/ui/components/button/icon-button'
import { Sheet } from '@/ui/components/sheet/sheet'

import { SITE_NAVIGATION, type NavigationKey } from '../domain/navigation'
import { LocaleSwitcher } from './locale-switcher'
import styles from './site-header.module.css'

interface MobileMenuLabels {
  readonly open: string
  readonly title: string
  readonly close: string
  readonly navigation: string
  readonly locale: string
  readonly cta: string
  readonly items: Record<NavigationKey, string>
}

export function MobileMenu({
  labels,
  className,
}: {
  readonly labels: MobileMenuLabels
  readonly className?: string
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Following a link closes the menu, including in-page anchors.
  useEffect(() => {
    const close = () => {
      setOpen(false)
    }
    window.addEventListener('hashchange', close)
    return () => {
      window.removeEventListener('hashchange', close)
    }
  }, [])
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setOpen(false)
  }

  return (
    <div className={className}>
      <IconButton
        glyph={ListIcon}
        label={labels.open}
        aria-expanded={open}
        onClick={() => {
          setOpen(true)
        }}
      />
      <Sheet
        open={open}
        onClose={() => {
          setOpen(false)
        }}
        title={labels.title}
        closeLabel={labels.close}
        footer={
          <ButtonLink href="/projects" stretch>
            {labels.cta}
          </ButtonLink>
        }
      >
        <nav aria-label={labels.navigation}>
          <ul className={styles.menuList}>
            {SITE_NAVIGATION.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={styles.menuLink}
                  aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
                  onClick={() => {
                    setOpen(false)
                  }}
                >
                  {labels.items[item.key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <LocaleSwitcher label={labels.locale} className={styles.menuLocale} />
      </Sheet>
    </div>
  )
}
