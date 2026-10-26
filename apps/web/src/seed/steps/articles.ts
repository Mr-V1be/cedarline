import { createHash } from 'node:crypto'
import path from 'node:path'

import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import type { Payload } from 'payload'
import sharp from 'sharp'

import {
  ARTICLES,
  SCHEME_ALTS,
  isSchemeName,
  type ArticlePicture,
  type SchemeName,
} from '../data/articles'
import type { Localized } from '../data/localized'
import {
  insulationComparisonScheme,
  pileFoundationScheme,
  wallSectionScheme,
} from '../data/schemes'
import { WALL_LAYERS } from '../data/technology'
import { DEFAULT_STANDARDS } from '@cedarline/house'
import { holdsSeedFile } from './media'
import { SEED, translate, upsert } from './upsert'

const SCHEME_SOURCE = 'Схема, нарисованная по данным сайта / scheme drawn from the site data'

// Text in the schemes is drawn with the site's fonts (see assets/fonts/fonts.conf); containers
// set the variable themselves, a developer machine gets it here before the first drawing.
process.env.FONTCONFIG_FILE ??= path.resolve(process.cwd(), 'assets/fonts/fonts.conf')
const WEBP = { quality: 88, effort: 5 } as const

/** The wall with another insulation thickness: deeper studs, the other layers unchanged. */
const wallWithInsulation = (thickness: number) =>
  WALL_LAYERS.map((layer) => (layer.role === 'insulation' ? { ...layer, thickness } : layer))

const SCHEMES: Readonly<Record<SchemeName, () => string>> = {
  'wall-section': () => wallSectionScheme(WALL_LAYERS),
  'pile-foundation': () => pileFoundationScheme(DEFAULT_STANDARDS),
  'insulation-compare': () =>
    insulationComparisonScheme(wallWithInsulation(150), wallWithInsulation(200)),
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
            ...(stored.origin?.checksum === origin.checksum &&
            holdsSeedFile(payload, stored.filename, name)
              ? {}
              : { file }),
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

/** Media document of an article picture; schemes are drawn and stored on the way. */
const pictureOf = (payload: Payload, picture: ArticlePicture) =>
  picture.kind === 'scheme'
    ? seedScheme(payload, picture.name, SCHEME_ALTS[picture.name])
    : existingRender(payload, picture.name)

/** A line of its own placing a picture in the text: `{{figure:render:kedr-aerial}}`. */
const FIGURE_LINE = /^\{\{figure:(render|scheme):([a-z0-9-]+)\}\}$/m

const parsePicture = (kind: string, name: string): ArticlePicture => {
  if (kind === 'render') return { kind, name }
  if (isSchemeName(name)) return { kind: 'scheme', name }
  throw new Error(`Unknown scheme ${name} in an article figure`)
}

/** Lexical id of a figure node: stable per article and position, so a reseed changes nothing. */
const figureId = (slug: string, index: number) =>
  createHash('sha256').update(`figure:${slug}:${index}`).digest('hex').slice(0, 24)

type LexicalState = ReturnType<typeof convertMarkdownToLexical>

/**
 * The article body: Markdown converted to the editor's format, with figure lines turned into
 * image nodes of the media they name (rendered as figures with the image's caption).
 */
async function articleBody(
  payload: Payload,
  slug: string,
  markdown: string,
  toLexical: (markdown: string) => LexicalState,
): Promise<LexicalState> {
  const pieces = markdown.split(new RegExp(FIGURE_LINE.source, 'gm'))
  const state = toLexical(pieces[0] ?? '')
  const children = [...state.root.children]
  for (let index = 1; index + 1 < pieces.length; index += 3) {
    const picture = parsePicture(pieces[index] ?? '', pieces[index + 1] ?? '')
    children.push({
      type: 'upload',
      version: 3,
      format: '',
      id: figureId(slug, index),
      fields: {},
      relationTo: 'media',
      value: await pictureOf(payload, picture),
    } as (typeof children)[number])
    children.push(...toLexical(pieces[index + 2] ?? '').root.children)
  }
  return { ...state, root: { ...state.root, children } }
}

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
        body: await articleBody(payload, article.slug, article.body.ru, lexical),
        cover: await pictureOf(payload, article.cover),
        projects: article.projects.flatMap((slug) => projects.get(slug) ?? []),
      },
    )
    await translate(payload, 'articles', id, {
      title: article.title.en,
      excerpt: article.excerpt.en,
      body: await articleBody(payload, article.slug, article.body.en, lexical),
    })
  }
  return ARTICLES.length
}
