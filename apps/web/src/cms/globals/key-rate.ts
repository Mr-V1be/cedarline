import type { GlobalConfig } from 'payload'

import { userCan } from '../access/policies'
import { label } from '../fields/labels'

/**
 * The last Bank of Russia key rate the site read. Written by the site only: it refreshes the
 * value on schedule and keeps it when the source is down; staff can see what is shown.
 */
export const KeyRate: GlobalConfig = {
  slug: 'key-rate',
  label: label('Ключевая ставка ЦБ', 'CBR key rate'),
  admin: {
    group: label('Цены и сроки', 'Prices and schedule'),
    description: label(
      'Обновляется автоматически с сайта Банка России; при недоступности источника сайт показывает последнее значение',
      'Refreshed automatically from the Bank of Russia; while the source is down the site shows the last value',
    ),
  },
  access: {
    read: ({ req }) => userCan(req.user, 'pricing.write'),
    update: () => false,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'rate',
          type: 'number',
          label: label('Ставка, %', 'Rate, %'),
          admin: { readOnly: true },
        },
        {
          name: 'effectiveFrom',
          type: 'date',
          label: label('Действует с', 'Effective from'),
          admin: { readOnly: true, date: { pickerAppearance: 'dayOnly' } },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'fetchedAt',
          type: 'date',
          label: label('Получена', 'Fetched'),
          admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'source',
          type: 'text',
          label: label('Источник', 'Source'),
          admin: { readOnly: true },
        },
      ],
    },
  ],
}
