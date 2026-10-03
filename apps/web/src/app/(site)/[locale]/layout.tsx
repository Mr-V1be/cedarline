import '@/ui/tokens/tokens.css'
import '@/ui/tokens/base.css'

import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { getServices } from '@/composition/services'
import { env } from '@/config/env'
import { ClientMessages } from '@/i18n/client-messages'
import { LOCALE_DEFINITIONS } from '@/i18n/locales'
import { routing } from '@/i18n/routing'
import { SiteFooter } from '@/modules/site/ui/site-footer'
import { SiteHeader } from '@/modules/site/ui/site-header'
import { fontVariables } from '@/ui/fonts'
import { ThemeScript } from '@/ui/theme/theme-script'

import styles from './layout.module.css'

interface LayoutProps {
  readonly children: ReactNode
  readonly params: Promise<{ locale: string }>
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const t = await getTranslations({ locale, namespace: 'common' })
  return {
    metadataBase: new URL(env.SITE_URL),
    title: { default: t('meta.title'), template: `%s — ${t('brand.name')}` },
    description: t('meta.description'),
    openGraph: {
      siteName: t('brand.name'),
      locale: LOCALE_DEFINITIONS[locale].openGraph,
      type: 'website',
    },
  }
}

export default async function SiteLayout({ children, params }: LayoutProps) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const [services, t] = await Promise.all([
    getServices(locale),
    getTranslations({ locale, namespace: 'common' }),
  ])
  const site = await services.site.load(locale)

  return (
    <html lang={LOCALE_DEFINITIONS[locale].tag} className={fontVariables} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <ClientMessages>
          <a href="#content" className={styles.skip}>
            {t('a11y.skipToContent')}
          </a>
          <SiteHeader />
          <main id="content" className={styles.main}>
            {children}
          </main>
          <SiteFooter site={site} />
        </ClientMessages>
      </body>
    </html>
  )
}
