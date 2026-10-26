import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { getServices } from '@/composition/services'
import { env } from '@/config/env'
import type { Locale } from '@/i18n/locales'
import { localizedPath, pageMetadata, SITE_LOGO_PATH } from '@/modules/seo/ui/page-metadata'
import { businessSchema } from '@/modules/seo/application/structured-data'
import { JsonLd } from '@/modules/seo/ui/json-ld'
import { ContactsView } from '@/modules/site/ui/contacts-view'
import { mapProps } from '@/modules/site/ui/map-props'
import { BRAND_NAME } from '@/ui/brand/brand'

interface ContactsPageProps {
  readonly params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: ContactsPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contacts.meta' })
  return pageMetadata({
    locale,
    path: '/contacts',
    title: t('title'),
    description: t('description'),
  })
}

export default async function ContactsPage({ params }: ContactsPageProps) {
  const { locale } = await params
  const [services, map] = await Promise.all([getServices(locale), mapProps()])
  const site = await services.site.load(locale)
  return (
    <>
      <JsonLd
        data={businessSchema({
          name: BRAND_NAME,
          url: `${env.SITE_URL}${localizedPath(locale, '/')}`,
          logo: `${env.SITE_URL}${SITE_LOGO_PATH}`,
          site,
        })}
      />
      <ContactsView site={site} map={map} />
    </>
  )
}
