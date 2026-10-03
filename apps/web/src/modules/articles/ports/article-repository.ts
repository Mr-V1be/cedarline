import type { Locale } from '@/i18n/locales'
import type { Page } from '@/modules/catalog/ports/project-repository'

import type { Article, ArticleSummary, ArticleTopic } from '../domain/article'

export interface ArticleQuery {
  readonly topic: ArticleTopic | null
  readonly page: number
}

export interface ArticleRepository {
  /** Published articles, newest first. */
  list(query: ArticleQuery, locale: Locale): Promise<Page<ArticleSummary>>
  findBySlug(slug: string, locale: Locale): Promise<Article | null>
  /** Slugs and update times of every published article, for the sitemap. */
  sitemap(): Promise<ReadonlyArray<{ readonly slug: string; readonly updatedAt: Date }>>
}
