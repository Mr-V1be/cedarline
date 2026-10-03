import { createHash } from 'node:crypto'

import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import type { Payload } from 'payload'
import sharp from 'sharp'

import { ARTICLES, type ArticleCover, type ArticleSeed } from '../data/articles'
import type { Localized } from '../data/localized'
import { pileFoundationScheme, wallSectionScheme } from '../data/schemes'
import { WALL_LAYERS } from '../data/technology'
import { DEFAULT_STANDARDS } from '@kedrovnik/house'
import { SEED, translate, upsert } from './upsert'

const SCHEME_SOURCE = 'Схема, нарисованная по данным сайта / scheme drawn from the site data'
const WEBP = { quality: 88, effort: 5 } as const

const SCHEMES: Readonly<Record<Extract<ArticleCover, { kind: 'scheme' }>['name'], () => string>> = {
  'wall-section': () => wallSectionScheme(WALL_LAYERS),
  'pile-foundation': () => pileFoundationScheme(DEFAULT_STANDARDS),
}

/** A scheme cover as a media document, keyed by name and replaced when the drawing changes. */
async function seedScheme(payload: Payload, name: keyof typeof SCHEMES, alt: Localized) {
  const data = await sharp(Buffer.from(SCHEMES[name]())).webp(WEBP).toBuffer()
  const origin = {
    key: `scheme:${name}`,
    checksum: createHash('sha256').update(data).digest('hex'),
  }
  const file = {
    data,
    mimetype: 'image/webp',
    name: `${name}-${origin.checksum.slice(0, 8)}.webp`,
    size: data.length,
  }
  const existing = await payload.find({
    ...SEED,
    collection: 'media',
    where: { 'origin.key': { equals: origin.key } },
    limit: 1,
  })
  const stored = existing.docs[0]
  const id =
    stored === undefined
      ? (
          await payload.create({
            ...SEED,
            collection: 'media',
            locale: 'ru',
            data: { alt: alt.ru, source: SCHEME_SOURCE, origin },
            file,
          })
        ).id
      : (
          await payload.update({
            ...SEED,
            collection: 'media',
            id: stored.id,
            locale: 'ru',
            data: { alt: alt.ru, origin },
            ...(stored.origin?.checksum === origin.checksum ? {} : { file }),
          })
        ).id
  await payload.update({ ...SEED, collection: 'media', id, locale: 'en', data: { alt: alt.en } })
  return id
}

/** A render cover: the media document seeded with the project gallery, used as it is. */
async function existingRender(payload: Payload, name: string) {
  const { docs } = await payload.find({
    ...SEED,
    collection: 'media',
    where: { 'origin.key': { equals: `render:${name}` } },
    limit: 1,
  })
  const [media] = docs
  if (media === undefined) throw new Error(`Render ${name} is not seeded; seed the projects first`)
  return media.id
}

const coverOf = (payload: Payload, article: ArticleSeed) =>
  article.cover.kind === 'scheme'
    ? seedScheme(payload, article.cover.name, article.coverAlt)
    : existingRender(payload, article.cover.name)

export async function seedArticles(payload: Payload, projects: Map<string, number>) {
  const editorConfig = await editorConfigFactory.default({ config: payload.config })
  const lexical = (markdown: string) => convertMarkdownToLexical({ editorConfig, markdown })
  for (const article of ARTICLES) {
    const id = await upsert(
      payload,
      'articles',
      { slug: { equals: article.slug } },
      {
        slug: article.slug,
        status: 'published',
        topic: article.topic,
        publishedAt: article.publishedAt,
        title: article.title.ru,
        excerpt: article.excerpt.ru,
        body: lexical(article.body.ru),
        cover: await coverOf(payload, article),
        projects: article.projects.flatMap((slug) => projects.get(slug) ?? []),
      },
    )
    await translate(payload, 'articles', id, {
      title: article.title.en,
      excerpt: article.excerpt.en,
      body: lexical(article.body.en),
    })
  }
  return ARTICLES.length
}
