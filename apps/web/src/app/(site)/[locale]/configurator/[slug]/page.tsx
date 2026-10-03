import { isShareCode } from '@kedrovnik/configurator'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { getServices } from '@/composition/services'
import type { Locale } from '@/i18n/locales'
import { pageMetadata } from '@/modules/seo/ui/page-metadata'
import { openConfigurator } from '@/modules/configurator/application/open-configurator'
import { Configurator } from '@/modules/configurator/ui/configurator'
import { ClientMessages } from '@/i18n/client-messages'
import { CONFIGURATOR_MESSAGES } from '@/modules/configurator/ui/client-messages'

import { saveConfigurationAction, submitLeadAction } from '../actions'

export const dynamic = 'force-dynamic'

interface ConfiguratorPageProps {
  readonly params: Promise<{ locale: Locale; slug: string }>
  /** `from`: share code of a saved configuration to continue from. */
  readonly searchParams: Promise<{ from?: string | string[] }>
}

export async function generateMetadata({ params }: ConfiguratorPageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const services = await getServices(locale)
  const family = await services.configurator.families.findFamily(slug, locale)
  const member = family?.members.find((candidate) => candidate.blueprint.slug === slug)
  if (member === undefined) return {}
  const [t, project] = await Promise.all([
    getTranslations({ locale, namespace: 'configurator.meta' }),
    services.projects.findBySlug(slug, locale),
  ])
  return pageMetadata({
    locale,
    path: `/configurator/${slug}`,
    title: t('title', { name: member.title }),
    description: t('description', { name: member.title }),
    picture: project?.cover ?? null,
  })
}

export default async function ConfiguratorPage({ params, searchParams }: ConfiguratorPageProps) {
  const [{ locale, slug }, { from }] = await Promise.all([params, searchParams])
  const services = await getServices(locale)
  const code = typeof from === 'string' && isShareCode(from) ? from : null
  const saved = code === null ? null : await services.saved.findByCode(code)
  const [view, site] = await Promise.all([
    openConfigurator(services.configurator, slug, locale, saved?.snapshot.configuration),
    services.site.load(locale),
  ])
  if (view === null) notFound()
  return (
    <ClientMessages namespaces={CONFIGURATOR_MESSAGES}>
      <Configurator
        view={view}
        save={saveConfigurationAction}
        submitLead={submitLeadAction}
        companyPhone={site.phone}
      />
    </ClientMessages>
  )
}
