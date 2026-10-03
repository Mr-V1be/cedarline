import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { getServices } from '@/composition/services'
import type { Locale } from '@/i18n/locales'
import { pageMetadata } from '@/modules/seo/ui/page-metadata'
import { PrivacyPolicy } from '@/modules/site/ui/privacy-policy'

interface PrivacyPageProps {
  readonly params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'privacy.meta' })
  return pageMetadata({
    locale,
    path: '/privacy',
    title: t('title'),
    description: t('description'),
  })
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params
  const services = await getServices(locale)
  return <PrivacyPolicy site={await services.site.load(locale)} />
}
