import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { ARTICLE_TOPICS, readingMinutes } from '@/modules/articles/domain/article'

import { publishedOr, requireCapability } from '../access/policies'
import { projected, publicationStatusField, slugField, titleField } from '../fields/common'
import { label } from '../fields/labels'
import { registryOptions } from '../fields/registry-labels'

/** Reading time is derived from the body on every save, so lists never load whole articles. */
const measureReading: CollectionBeforeChangeHook = ({ data }) => {
  const body: unknown = data.body
  if (body === null || typeof body !== 'object') return data
  return {
    ...data,
    readingMinutes: readingMinutes(
      convertLexicalToPlaintext({
        data: body as Parameters<typeof convertLexicalToPlaintext>[0]['data'],
      }),
    ),
  }
}

/**
 * Articles: rich text with a cover that is a render of our scene or a scheme, never a stock
 * photo. Content managers write them; the site lists published ones newest first.
 */
export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: label('Статья', 'Article'), plural: label('Статьи', 'Articles') },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'topic', 'publishedAt', 'status'],
    group: label('Контент', 'Content'),
  },
  defaultSort: '-publishedAt',
  access: {
    read: publishedOr('content.write'),
    create: requireCapability('content.write'),
    update: requireCapability('content.write'),
    delete: requireCapability('content.write'),
  },
  hooks: { beforeChange: [measureReading] },
  fields: [
    titleField(),
    slugField(),
    publicationStatusField(),
    {
      name: 'publishedAt',
      type: 'date',
      label: label('Дата публикации', 'Publication date'),
      required: true,
      index: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'topic',
      type: 'select',
      label: label('Тема', 'Topic'),
      required: true,
      index: true,
      options: registryOptions('articleTopic', ARTICLE_TOPICS),
      admin: { position: 'sidebar' },
    },
    projected({
      name: 'readingMinutes',
      type: 'number',
      label: label('Время чтения, мин', 'Reading time, min'),
      // Each language has its own text, so its own reading time.
      localized: true,
      admin: { position: 'sidebar' },
    }),
    {
      name: 'excerpt',
      type: 'textarea',
      label: label('Анонс', 'Excerpt'),
      required: true,
      localized: true,
      maxLength: 280,
      admin: {
        description: label(
          'Под заголовком в списке, в превью ссылки и в описании для поисковиков',
          'Shown in the list, in link previews and as the search description',
        ),
      },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: label('Обложка', 'Cover'),
      required: true,
      admin: {
        description: label(
          'Рендер из 3D-сцены или схема — без стоковых фото людей',
          'A render of the 3D scene or a scheme — no stock photos of people',
        ),
      },
    },
    {
      name: 'body',
      type: 'richText',
      label: label('Текст', 'Body'),
      required: true,
      localized: true,
    },
    {
      name: 'projects',
      type: 'relationship',
      relationTo: 'projects',
      hasMany: true,
      label: label('Проекты по теме', 'Related projects'),
      maxRows: 3,
    },
  ],
}
