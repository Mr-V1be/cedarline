import type { Payload, Where } from 'payload'

import type { Locale } from '@/i18n/locales'
import type { Page } from '@/modules/catalog/ports/project-repository'

import type { Article, ArticleSummary } from '../domain/article'
import type { ArticleQuery, ArticleRepository } from '../ports/article-repository'
import { toArticle, toArticleSummary } from './article-mapper'

export const ARTICLES_PAGE_SIZE = 9

const PUBLIC = { overrideAccess: false } as const
const PUBLISHED: Where = { status: { equals: 'published' } }
const SUMMARY_SELECT = {
  slug: true,
  title: true,
  excerpt: true,
  topic: true,
  cover: true,
  publishedAt: true,
  readingMinutes: true,
} as const
/** Ceiling of the sitemap listing; far above what a content team publishes. */
const SITEMAP_LIMIT = 5000

export class PayloadArticleRepository implements ArticleRepository {
  constructor(private readonly payload: Payload) {}

  async list(query: ArticleQuery, locale: Locale): Promise<Page<ArticleSummary>> {
    const result = await this.payload.find({
      ...PUBLIC,
      collection: 'articles',
      locale,
      depth: 1,
      limit: ARTICLES_PAGE_SIZE,
      page: query.page,
      sort: ['-publishedAt', '-id'],
      where:
        query.topic === null ? PUBLISHED : { and: [PUBLISHED, { topic: { equals: query.topic } }] },
      select: SUMMARY_SELECT,
    })
    return {
      items: result.docs.map(toArticleSummary),
      total: result.totalDocs,
      page: result.page ?? query.page,
      pageCount: result.totalPages,
    }
  }

  async findBySlug(slug: string, locale: Locale): Promise<Article | null> {
    const { docs } = await this.payload.find({
      ...PUBLIC,
      collection: 'articles',
      locale,
      depth: 2,
      limit: 1,
      where: { and: [PUBLISHED, { slug: { equals: slug } }] },
    })
    const [document] = docs
    return document === undefined ? null : toArticle(document)
  }

  async sitemap(): Promise<ReadonlyArray<{ readonly slug: string; readonly updatedAt: Date }>> {
    const { docs } = await this.payload.find({
      ...PUBLIC,
      collection: 'articles',
      depth: 0,
      limit: SITEMAP_LIMIT,
      pagination: false,
      where: PUBLISHED,
      select: { slug: true, updatedAt: true },
    })
    return docs.map((doc) => ({ slug: doc.slug, updatedAt: new Date(doc.updatedAt) }))
  }
}
