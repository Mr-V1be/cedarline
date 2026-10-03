import { notFound } from 'next/navigation'

import { isLocale } from '@/i18n/locales'

import { loadArticle } from './load-article'

/**
 * Resolves the article before the page's loading boundary starts streaming, so an unknown or
 * unpublished article answers with a real 404 status instead of a 200 with a not-found body.
 */
export default async function ArticleLayout({
  children,
  params,
}: LayoutProps<'/[locale]/articles/[slug]'>) {
  const { locale, slug } = await params
  if (!isLocale(locale) || (await loadArticle(slug, locale)) === null) notFound()
  return children
}
