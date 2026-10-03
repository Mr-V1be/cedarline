import { ArticleIcon } from '@phosphor-icons/react/ssr'
import Image from 'next/image'
import { getFormatter, getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { Icon } from '@/ui/components/icon/icon'

import type { ArticleSummary } from '../domain/article'
import styles from './articles.module.css'

interface ArticleCardProps {
  readonly article: ArticleSummary
  readonly sizes: string
  /** The lead article of a list: larger, image beside the text on wide screens. */
  readonly featured?: boolean
  readonly priority?: boolean
  readonly headingLevel?: 'h2' | 'h3'
}

/** An article in a list: its cover, topic, title, excerpt and how long it takes to read. */
export async function ArticleCard({
  article,
  sizes,
  featured = false,
  priority = false,
  headingLevel: Heading = 'h3',
}: ArticleCardProps) {
  const [t, registry, format] = await Promise.all([
    getTranslations('articles'),
    getTranslations('registry.articleTopic'),
    getFormatter(),
  ])
  return (
    <article className={featured ? `${styles.card} ${styles.featured}` : styles.card}>
      <div className={styles.cardMedia}>
        {article.cover === null ? (
          <div className={styles.placeholder}>
            <Icon glyph={ArticleIcon} size="l" />
          </div>
        ) : (
          <Image
            className={styles.cardImage}
            src={article.cover.url}
            alt={article.cover.alt}
            fill
            sizes={sizes}
            priority={priority}
          />
        )}
      </div>
      <div className={styles.cardBody}>
        <p className={styles.topic}>{registry(article.topic)}</p>
        <Heading className={styles.cardTitle}>
          <Link href={`/articles/${article.slug}`} className={styles.cardLink}>
            {article.title}
          </Link>
        </Heading>
        <p className={styles.excerpt}>{article.excerpt}</p>
        <p className={styles.meta}>
          <time dateTime={article.publishedAt.toISOString()}>
            {format.dateTime(article.publishedAt, { dateStyle: 'long' })}
          </time>
          <span aria-hidden>·</span>
          <span>{t('reading', { minutes: article.readingMinutes })}</span>
        </p>
      </div>
    </article>
  )
}
