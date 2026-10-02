import { notFound } from 'next/navigation'

import { isLocale } from '@/i18n/locales'

import { loadOverview } from './load-overview'

/**
 * Resolves the project before the page's loading boundary starts streaming, so an unknown or
 * unpublished project answers with a real 404 status instead of a 200 with a not-found body.
 */
export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<'/[locale]/projects/[slug]'>) {
  const { locale, slug } = await params
  if (!isLocale(locale) || (await loadOverview(slug, locale)) === null) notFound()
  return children
}
