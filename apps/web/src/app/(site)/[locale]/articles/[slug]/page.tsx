import { CubeIcon } from '@phosphor-icons/react/ssr'
import Image from 'next/image'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFormatter, getTranslations } from 'next-intl/server'

import { getServices } from '@/composition/services'
import { env } from '@/config/env'
import { LOCALE_DEFINITIONS, type Locale } from '@/i18n/locales'
import { ArticleBody } from '@/modules/articles/ui/article-body'
import { ArticleCard } from '@/modules/articles/ui/article-card'
import { ProjectCard } from '@/modules/catalog/ui/project-card'
import { articleSchema, breadcrumbSchema } from '@/modules/seo/application/structured-data'
import { JsonLd } from '@/modules/seo/ui/json-ld'
import { localizedPath, pageMetadata } from '@/modules/seo/ui/page-metadata'
import { Breadcrumbs } from '@/ui/components/breadcrumbs/breadcrumbs'
import { ButtonLink } from '@/ui/components/button/button'
import { Container, Section } from '@/ui/components/layout/container'
import { SectionHeading } from '@/ui/components/section-heading/section-heading'

import styles from './article.module.css'
import { loadArticle } from './load-article'

/** Every request reads current content; caching belongs to the repositories. */
export const dynamic = 'force-dynamic'

interface ArticlePageProps {
  readonly params: Promise<{ locale: Locale; slug: string }>
}

const MORE_COUNT = 3

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const article = await loadArticle(slug, locale)
  if (article === null) return {}
  return pageMetadata({
    locale,
    path: `/articles/${article.slug}`,
    title: article.title,
    description: article.excerpt,
    picture: article.cover,
    type: 'article',
  })
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, slug } = await params
  const article = await loadArticle(slug, locale)
  if (article === null) notFound()
  const [services, t, nav, registry, format] = await Promise.all([
    getServices(locale),
    getTranslations('articles'),
    getTranslations('common.nav'),
    getTranslations('registry.articleTopic'),
    getFormatter(),
  ])
  const latest = await services.articles.list({ topic: null, page: 1 }, locale)
  const more = latest.items.filter((item) => item.id !== article.id).slice(0, MORE_COUNT)
  const url = (path: string) => `${env.SITE_URL}${localizedPath(locale, path)}`

  return (
    <>
      <JsonLd
        data={articleSchema({
          title: article.title,
          description: article.excerpt,
          url: url(`/articles/${article.slug}`),
          image: article.cover === null ? null : `${env.SITE_URL}${article.cover.url}`,
          publishedAt: article.publishedAt,
          language: LOCALE_DEFINITIONS[locale].tag,
          publisherUrl: url('/'),
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: nav('home'), url: url('/') },
          { name: nav('articles'), url: url('/articles') },
          { name: article.title, url: url(`/articles/${article.slug}`) },
        ])}
      />
      <Container className={styles.page}>
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
              priority
              sizes="(min-width: 1360px) 1264px, 100vw"
              className={styles.coverImage}
            />
          </div>
        )}
        <div className={styles.layout}>
          <ArticleBody body={article.body} />
          {article.projects.length === 0 ? null : (
            <aside className={styles.aside} aria-labelledby="related-title">
              <h2 id="related-title" className={styles.asideTitle}>
                {t('related')}
              </h2>
              <ul className={styles.related}>
                {article.projects.map((project) => (
                  <li key={project.id}>
                    <ProjectCard project={project} sizes="(min-width: 1024px) 320px, 100vw" />
                  </li>
                ))}
              </ul>
              <ButtonLink
                href={`/configurator/${article.projects[0]?.slug ?? ''}`}
                icon={CubeIcon}
                stretch
              >
                {t('configure')}
              </ButtonLink>
            </aside>
          )}
        </div>
      </Container>
      {more.length === 0 ? null : (
        <Section tone="sunken" aria-labelledby="more-title">
          <Container>
            <SectionHeading id="more-title" title={t('more')} />
            <ul className={styles.more}>
              {more.map((item) => (
                <li key={item.id}>
                  <ArticleCard
                    article={item}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}
    </>
  )
}
