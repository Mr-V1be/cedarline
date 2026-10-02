import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { getServices } from '@/composition/services'
import type { Locale } from '@/i18n/locales'
import { openSaved } from '@/modules/configurator/application/open-saved'
import { SavedConfiguration } from '@/modules/configurator/ui/share/saved-configuration'

import { submitLeadAction } from '../../configurator/actions'

export const dynamic = 'force-dynamic'

interface SavedPageProps {
  readonly params: Promise<{ locale: Locale; code: string }>
}

async function load(locale: Locale, code: string) {
  const services = await getServices(locale)
  return openSaved({ ...services.configurator, saved: services.saved }, code, locale)
}

export async function generateMetadata({ params }: SavedPageProps): Promise<Metadata> {
  const { locale, code } = await params
  const view = await load(locale, code)
  const t = await getTranslations({ locale, namespace: 'configurator.meta' })
  const name =
    view?.names.projects[view.saved.snapshot.configuration.project] ?? view?.saved.projectSlug
  return {
    ...(name === undefined ? {} : { title: t('savedTitle', { name }) }),
    // A saved configuration belongs to whoever has the link; search engines do not need it.
    robots: { index: false, follow: false },
  }
}

export default async function SavedConfigurationPage({ params }: SavedPageProps) {
  const { locale, code } = await params
  const [view, services] = await Promise.all([load(locale, code), getServices(locale)])
  if (view === null) notFound()
  const site = await services.site.load(locale)
  return (
    <SavedConfiguration
      view={view}
      renderUrl={view.saved.renderId === null ? null : `/files/c/${code}/render`}
      submitLead={submitLeadAction}
      companyPhone={site.phone}
    />
  )
}
