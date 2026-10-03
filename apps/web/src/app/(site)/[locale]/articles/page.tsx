import { ArticleIcon } from '@phosphor-icons/react/ssr'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { getServices } from '@/composition/services'
import type { Locale } from '@/i18n/locales'
import { ARTICLE_TOPICS, isArticleTopic } from '@/modules/articles/domain/article'
import { ArticleCard } from '@/modules/articles/ui/article-card'
import { TopicFilter } from '@/modules/articles/ui/topic-filter'
import { pageMetadata } from '@/modules/seo/ui/page-metadata'
import { ButtonLink } from '@/ui/components/button/button'
import { Container } from '@/ui/components/layout/container'
import { Pagination } from '@/ui/components/pagination/pagination'
import { StateMessage } from '@/ui/components/state/state-message'

import styles from './articles.module.css'

/** Every request reads current content; caching belongs to the repositories. */
export const dynamic = 'force-dynamic'

interface ArticlesPageProps {
  readonly params: Promise<{ locale: Locale }>
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>
}

const pageOf = (value: unknown) =>
  typeof value === 'string' && /^\d{1,4}$/.test(value) ? Math.max(1, Number(value)) : 1

export async function generateMetadata({ params }: ArticlesPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'articles.meta' })
  return pageMetadata({
    locale,
    path: '/articles',
    title: t('title'),
    description: t('description'),
  })
}

export default async function ArticlesPage({ params, searchParams }: ArticlesPageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  const topic = typeof query.topic === 'string' && isArticleTopic(query.topic) ? query.topic : null
  const page = pageOf(query.page)
  const [services, t, registry] = await Promise.all([
    getServices(locale),
    getTranslations('articles'),
    getTranslations('registry.articleTopic'),
  ])
  const result = await services.articles.list({ topic, page }, locale)
  // The newest article leads the first page of the full list.
  const featured = page === 1 && topic === null ? result.items[0] : undefined
  const others = featured === undefined ? result.items : result.items.slice(1)
  const hrefFor = (target: number) => {
    const search = new URLSearchParams()
    if (topic !== null) search.set('topic', topic)
    if (target > 1) search.set('page', String(target))
    const encoded = search.toString()
    return encoded === '' ? '/articles' : `/articles?${encoded}`
  }

  return (
    <Container className={styles.page}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.lead}>{t('lead')}</p>
        </div>
        <div className={styles.filter}>
          <TopicFilter
            label={t('topic')}
            value={topic ?? ''}
            options={[
              { value: '', label: t('allTopics') },
              ...ARTICLE_TOPICS.map((key) => ({ value: key, label: registry(key) })),
            ]}
          />
        </div>
      </header>
      {result.items.length === 0 ? (
        <StateMessage
          glyph={ArticleIcon}
          title={t('empty.title')}
          description={t('empty.description')}
          action={<ButtonLink href="/articles">{t('empty.action')}</ButtonLink>}
        />
      ) : (
        <>
          {featured === undefined ? null : (
            <ArticleCard
              article={featured}
              featured
              priority
              headingLevel="h2"
              sizes="(min-width: 900px) 58vw, 100vw"
            />
          )}
          <ul className={styles.grid}>
            {others.map((article) => (
              <li key={article.id}>
                <ArticleCard
                  article={article}
                  headingLevel="h2"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              </li>
            ))}
          </ul>
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            hrefFor={hrefFor}
            labels={{
              navigation: t('pagination.navigation'),
              previous: t('pagination.previous'),
              next: t('pagination.next'),
              page: (number) => t('pagination.page', { page: number }),
            }}
          />
        </>
      )}
    </Container>
  )
}
