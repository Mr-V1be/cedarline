import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { Container } from '@/ui/components/layout/container'

import { LEGAL_LINKS, SITE_NAVIGATION } from '../domain/navigation'
import type { SiteContent } from '../domain/site'
import { Logo } from './logo'
import styles from './site-footer.module.css'

export async function SiteFooter({ site }: { readonly site: SiteContent }) {
  const t = await getTranslations('common')
  const year = new Date().getFullYear()
  return (
    <footer className={styles.footer}>
      <Container className={styles.grid}>
        <div className={styles.brand}>
          <Logo name={t('brand.name')} />
          <p className={styles.tagline}>{t('brand.tagline')}</p>
          <p className={styles.muted}>{site.region}</p>
        </div>
        <nav aria-label={t('footer.sections')}>
          <h2 className={styles.heading}>{t('footer.sections')}</h2>
          <ul className={styles.list}>
            {SITE_NAVIGATION.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className={styles.link}>
                  {t(`nav.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <address className={styles.contacts}>
          <h2 className={styles.heading}>{t('footer.contacts')}</h2>
          <a className={styles.link} href={`tel:${site.phone.replace(/[^\d+]/g, '')}`}>
            {site.phone}
          </a>
          <a className={styles.link} href={`mailto:${site.email}`}>
            {site.email}
          </a>
          <p className={styles.muted}>{site.address}</p>
          <p className={styles.muted}>{site.hours}</p>
        </address>
      </Container>
      <Container className={styles.legal}>
        <p>{t('footer.copyright', { year })}</p>
        <nav aria-label={t('footer.legal')}>
          <ul className={styles.legalLinks}>
            {LEGAL_LINKS.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className={styles.link}>
                  {t(`legal.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p>{t('footer.demo')}</p>
      </Container>
    </footer>
  )
}
