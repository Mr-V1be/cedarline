import type { CollectionConfig } from 'payload'

import { anyone, requireCapability } from '../access/policies'
import { label } from '../fields/labels'

/**
 * Originals are stored as WebP; the site requests responsive sizes from the Next.js image
 * optimizer, so only the admin thumbnail is generated here.
 */
const WEBP_QUALITY = 82
const ADMIN_THUMBNAIL_WIDTH = 480
const MEDIA_CACHE = 'public, max-age=86400, stale-while-revalidate=604800'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: label('Изображение', 'Image'), plural: label('Медиатека', 'Media') },
  admin: { group: label('Контент', 'Content') },
  access: {
    read: anyone,
    create: requireCapability('content.write'),
    update: requireCapability('content.write'),
    delete: requireCapability('content.write'),
  },
  upload: {
    // Relative to the server's working directory (apps/web locally, /app in a container).
    staticDir: 'media',
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/avif'],
    adminThumbnail: 'thumb',
    focalPoint: true,
    formatOptions: { format: 'webp', options: { quality: WEBP_QUALITY } },
    // A replaced file may keep its name, so originals are cached for a day, not for good.
    modifyResponseHeaders: ({ headers }) => {
      headers.set('Cache-Control', MEDIA_CACHE)
      return headers
    },
    imageSizes: [
      {
        name: 'thumb',
        width: ADMIN_THUMBNAIL_WIDTH,
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: WEBP_QUALITY } },
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: label('Описание изображения', 'Alternative text'),
      required: true,
      localized: true,
    },
    {
      name: 'source',
      type: 'text',
      label: label('Источник и лицензия', 'Source and licence'),
      required: true,
      admin: {
        description: label(
          'Например: рендер 3D-сцены проекта',
          'E.g. render of the project 3D scene',
        ),
      },
    },
    {
      name: 'origin',
      type: 'group',
      label: label('Импорт', 'Import'),
      admin: {
        readOnly: true,
        condition: (data) => Boolean((data as { origin?: { key?: string } }).origin?.key),
        description: label(
          'Заполняется скриптами импорта: ключ ассета и контрольная сумма исходного файла',
          'Set by import scripts: asset key and checksum of the source file',
        ),
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'key',
              type: 'text',
              label: label('Ключ', 'Key'),
              unique: true,
              index: true,
              admin: { width: '40%' },
            },
            {
              name: 'checksum',
              type: 'text',
              label: label('SHA-256 исходника', 'Source SHA-256'),
              admin: { width: '60%' },
            },
          ],
        },
      ],
    },
  ],
}
