import { notFound } from 'next/navigation'

import { isLocale } from '@/i18n/locales'

import { ArticleHeader } from './article-header'
import { loadArticle } from './load-article'

/**
 * Resolves the article before the page's loading boundary starts streaming, so an unknown or
 * unpublished article answers with a real 404 status instead of a 200 with a not-found body.
 * The header and cover come with it; the skeleton only stands in for the body while it streams.
 */
export default async function ArticleLayout({
  children,
  params,
}: LayoutProps<'/[locale]/articles/[slug]'>) {
  const { locale, slug } = await params
  const article = isLocale(locale) ? await loadArticle(slug, locale) : null
  if (article === null) notFound()
  return (
    <>
      <ArticleHeader article={article} />
      {children}
    </>
  )
}
