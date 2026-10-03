import { notFound } from 'next/navigation'

import { isLocale } from '@/i18n/locales'

import { loadMember } from './load-member'

/**
 * Resolves the project before the configurator's loading boundary starts streaming, so an
 * unknown or unpublished project answers with a real 404 status.
 */
export default async function ConfiguratorLayout({
  children,
  params,
}: LayoutProps<'/[locale]/configurator/[slug]'>) {
  const { locale, slug } = await params
  if (!isLocale(locale) || (await loadMember(slug, locale)) === null) notFound()
  return children
}
