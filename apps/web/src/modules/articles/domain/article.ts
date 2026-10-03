import type { ImageAsset, ProjectSummary } from '@/modules/catalog/domain/project'

/** Topics of the articles; the list page filters by them and the CMS offers them. */
export const ARTICLE_TOPICS = ['technology', 'construction', 'design', 'sauna', 'money'] as const
export type ArticleTopic = (typeof ARTICLE_TOPICS)[number]

export const isArticleTopic = (value: string): value is ArticleTopic =>
  (ARTICLE_TOPICS as readonly string[]).includes(value)

/** An article in a list: what a card shows. */
export interface ArticleSummary {
  readonly id: number
  readonly slug: string
  readonly title: string
  readonly excerpt: string
  readonly topic: ArticleTopic
  readonly cover: ImageAsset | null
  readonly publishedAt: Date
  readonly readingMinutes: number
}

/** The whole article: its body as stored rich text and the projects it is about. */
export interface Article extends ArticleSummary {
  /** Lexical editor state; rendered by the article body component. */
  readonly body: unknown
  readonly projects: readonly ProjectSummary[]
}

/** Reading speed for the reading-time estimate, words a minute. */
const WORDS_PER_MINUTE = 180

export function readingMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}
