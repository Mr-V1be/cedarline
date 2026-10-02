import { getTranslations } from 'next-intl/server'

import { ButtonLink } from '@/ui/components/button/button'
import { Container } from '@/ui/components/layout/container'
import { ThemeToggle } from '@/ui/theme/theme-toggle'

import { SITE_NAVIGATION, type NavigationKey } from '../domain/navigation'
import { HeaderNav } from './header-nav'
import { LocaleSwitcher } from './locale-switcher'
import { Logo } from './logo'
import { MobileMenu } from './mobile-menu'
import styles from './site-header.module.css'

export async function SiteHeader() {
  const t = await getTranslations('common')
  const items = Object.fromEntries(
    SITE_NAVIGATION.map((item) => [item.key, t(`nav.${item.key}`)]),
  ) as Record<NavigationKey, string>

  return (
    <header className={styles.header}>
      <Container className={styles.bar}>
        <Logo name={t('brand.name')} homeLabel={t('nav.home')} />
        <div className={styles.desktopOnly}>
          <HeaderNav labels={items} label={t('nav.label')} />
        </div>
        <div className={styles.tools}>
          <div className={styles.desktopOnly}>
            <LocaleSwitcher label={t('locale.label')} className={styles.locale} />
          </div>
          <ThemeToggle label={t('theme.label')} />
          <div className={styles.desktopOnly}>
            <ButtonLink href="/projects">{t('actions.chooseProject')}</ButtonLink>
          </div>
          <MobileMenu
            className={styles.mobileOnly}
            labels={{
              open: t('actions.openMenu'),
              title: t('actions.menu'),
              close: t('actions.close'),
              navigation: t('nav.label'),
              locale: t('locale.label'),
              cta: t('actions.chooseProject'),
              items,
            }}
          />
        </div>
      </Container>
    </header>
  )
}
