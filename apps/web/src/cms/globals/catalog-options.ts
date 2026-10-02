import { FACADE_FINISHES } from '@kedrovnik/house'
import type { GlobalConfig } from 'payload'

import { anyone, requireCapability } from '../access/policies'
import { hexColorField, keyField } from '../fields/common'
import { label } from '../fields/labels'
import { registryOptions } from '../fields/registry-labels'

/** Options offered to customers that are pure data: facade palettes and building services. */
export const CatalogOptions: GlobalConfig = {
  slug: 'catalog-options',
  label: label('Опции каталога', 'Catalog options'),
  admin: { group: label('Цены и сроки', 'Prices and schedule') },
  access: { read: anyone, update: requireCapability('pricing.write') },
  fields: [
    {
      name: 'facadePalettes',
      type: 'array',
      label: label('Палитры фасадов', 'Facade palettes'),
      labels: { singular: label('Палитра', 'Palette'), plural: label('Палитры', 'Palettes') },
      fields: [
        {
          name: 'finish',
          type: 'select',
          label: label('Отделка', 'Finish'),
          required: true,
          options: registryOptions('facadeFinish', FACADE_FINISHES),
        },
        {
          name: 'colors',
          type: 'array',
          label: label('Цвета', 'Colours'),
          minRows: 1,
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  label: label('Название', 'Name'),
                  required: true,
                  localized: true,
                  admin: { width: '60%' },
                },
                { ...hexColorField('hex', label('Цвет', 'Colour')), admin: { width: '40%' } },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'engineeringSystems',
      type: 'array',
      label: label('Инженерные системы', 'Building services'),
      labels: { singular: label('Система', 'System'), plural: label('Системы', 'Systems') },
      fields: [
        {
          type: 'row',
          fields: [
            { ...keyField(), admin: { width: '30%' } },
            {
              name: 'name',
              type: 'text',
              label: label('Название', 'Name'),
              required: true,
              localized: true,
              admin: { width: '70%' },
            },
          ],
        },
      ],
    },
  ],
}
