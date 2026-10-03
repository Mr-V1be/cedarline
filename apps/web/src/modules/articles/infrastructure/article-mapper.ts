import type { Article as ArticleDocument, Project } from '@/cms/generated/payload-types'
import { toImageAsset } from '@/modules/catalog/infrastructure/media-mapper'
import { toProjectSummary } from '@/modules/catalog/infrastructure/project-read-mapper'

import { isArticleTopic, type Article, type ArticleSummary } from '../domain/article'

export type ArticleSummaryDocument = Pick<
  ArticleDocument,
  'id' | 'slug' | 'title' | 'excerpt' | 'topic' | 'cover' | 'publishedAt' | 'readingMinutes'
>

export function toArticleSummary(document: ArticleSummaryDocument): ArticleSummary {
  const topic: string = document.topic
  if (!isArticleTopic(topic)) throw new Error(`Unknown article topic ${topic}`)
  return {
    id: document.id,
    slug: document.slug,
    title: document.title,
    excerpt: document.excerpt,
    topic,
    cover: toImageAsset(document.cover),
    publishedAt: new Date(document.publishedAt),
    readingMinutes: document.readingMinutes ?? 1,
  }
}

/**
 * Images in the text arrive as whole media documents; the site needs only what an image
 * component takes, with the URL as a local path. Other nodes pass through unchanged.
 */
function normalizeUploads(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(normalizeUploads)
  if (typeof node !== 'object' || node === null) return node
  const entries = Object.entries(node).map(([key, value]): [string, unknown] => [
    key,
    key === 'value' && 'type' in node && node.type === 'upload'
      ? toImageAsset(
          typeof value === 'object' ? (value as Parameters<typeof toImageAsset>[0]) : null,
        )
      : normalizeUploads(value),
  ])
  return Object.fromEntries(entries)
}

const isPublishedProject = (value: number | Project): value is Project =>
  typeof value !== 'number' && value.status === 'published'

export function toArticle(document: ArticleDocument): Article {
  return {
    ...toArticleSummary(document),
    body: normalizeUploads(document.body),
    projects: (document.projects ?? []).filter(isPublishedProject).map(toProjectSummary),
  }
}
