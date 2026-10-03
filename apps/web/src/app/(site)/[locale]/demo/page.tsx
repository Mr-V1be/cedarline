import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { isDemoStand } from '@/composition/demo'
import type { Locale } from '@/i18n/locales'
import { DemoAccess } from '@/modules/demo/ui/demo-access'
import { pageMetadata } from '@/modules/seo/ui/page-metadata'

import { startDemoSessionAction } from './actions'

interface DemoPageProps {
  readonly params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: DemoPageProps): Promise<Metadata> {
  const { locale } = await params
  if (!isDemoStand()) return {}
  const t = await getTranslations({ locale, namespace: 'demo.meta' })
  return pageMetadata({
    locale,
    path: '/demo',
    title: t('title'),
    description: t('description'),
    indexable: false,
  })
}

/** Exists only on a demo stand; anywhere else the address is a plain 404. */
export default function DemoPage() {
  if (!isDemoStand()) notFound()
  return <DemoAccess action={startDemoSessionAction} />
}
