import { notFound } from 'next/navigation'

import { isLocale } from '@/i18n/locales'

import { loadOverview } from './load-overview'
import { ProjectHero } from './project-hero'

/**
 * Resolves the project before the page's loading boundary starts streaming, so an unknown or
 * unpublished project answers with a real 404 status instead of a 200 with a not-found body.
 * The hero comes with it: the first paint already shows the gallery, and the skeleton only
 * stands in for the sections below while they stream.
 */
export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<'/[locale]/projects/[slug]'>) {
  const { locale, slug } = await params
  const overview = isLocale(locale) ? await loadOverview(slug, locale) : null
  if (overview === null) notFound()
  return (
    <>
      <ProjectHero overview={overview} />
      {children}
    </>
  )
}
