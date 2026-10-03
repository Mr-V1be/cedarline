import Image from 'next/image'
import { getFormatter, getTranslations } from 'next-intl/server'

import type { Article } from '@/modules/articles/domain/article'
import { Breadcrumbs } from '@/ui/components/breadcrumbs/breadcrumbs'
import { Container } from '@/ui/components/layout/container'

import styles from './article.module.css'

/**
 * The top of an article: breadcrumbs, title, lead and cover. The layout renders it from the
 * article it has already loaded, so the cover is in the first paint and only the body below
 * waits behind the loading skeleton.
 */
export async function ArticleHeader({ article }: { readonly article: Article }) {
  const [t, nav, registry, format] = await Promise.all([
    getTranslations('articles'),
    getTranslations('common.nav'),
    getTranslations('registry.articleTopic'),
    getFormatter(),
  ])
  return (
    <Container className={styles.top}>
      <Breadcrumbs
        label={t('breadcrumbs')}
        items={[{ label: nav('articles'), href: '/articles' }, { label: article.title }]}
      />
      <header className={styles.header}>
        <p className={styles.meta}>
          <span className={styles.topic}>{registry(article.topic)}</span>
          <time dateTime={article.publishedAt.toISOString()}>
            {format.dateTime(article.publishedAt, { dateStyle: 'long' })}
          </time>
          <span>{t('reading', { minutes: article.readingMinutes })}</span>
        </p>
        <h1 className={styles.title}>{article.title}</h1>
        <p className={styles.lead}>{article.excerpt}</p>
      </header>
      {article.cover === null ? null : (
        <div className={styles.cover}>
          <Image
            src={article.cover.url}
            alt={article.cover.alt}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 1360px) 1264px, 100vw"
            className={styles.coverImage}
          />
        </div>
      )}
    </Container>
  )
}
