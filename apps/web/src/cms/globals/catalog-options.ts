import { FACADE_FINISHES, ROOF_KIND_KEYS, WINDOW_STYLES } from '@cedarline/house'
import type { GlobalConfig } from 'payload'

import { anyone, requireCapability } from '../access/policies'
import { conditionsField } from '../fields/condition-fields'
import { hexColorField, keyField } from '../fields/common'
import { label } from '../fields/labels'
import { registryOptions } from '../fields/registry-labels'
import { validateCatalogOptions } from '../hooks/catalog-options-hooks'

const TERRACE_DEPTH = { min: 1000, max: 4000 } as const

/**
 * What customers may choose in the configurator and which combinations are not built. Pure
 * data: the configurator domain reads it, the content manager edits it without a developer.
 */
export const CatalogOptions: GlobalConfig = {
  slug: 'catalog-options',
  label: label('Опции конфигуратора', 'Configurator options'),
  admin: { group: label('Цены и сроки', 'Prices and schedule') },
  access: { read: anyone, update: requireCapability('pricing.write') },
  hooks: { beforeChange: [validateCatalogOptions] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: label('Фасады', 'Facades'),
          fields: [
            {
              name: 'facadePalettes',
              type: 'array',
              label: label('Палитры фасадов', 'Facade palettes'),
              labels: {
                singular: label('Палитра', 'Palette'),
                plural: label('Палитры', 'Palettes'),
              },
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
                        {
                          ...hexColorField('hex', label('Цвет', 'Colour')),
                          admin: { width: '40%' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: label('Кровля, окна, терраса', 'Roof, windows, terrace'),
          fields: [
            {
              name: 'roofKinds',
              type: 'select',
              hasMany: true,
              required: true,
              label: label('Предлагаемые кровли', 'Offered roofs'),
              options: registryOptions('roofKind', ROOF_KIND_KEYS),
              defaultValue: [...ROOF_KIND_KEYS],
            },
            {
              name: 'windowStyles',
              type: 'select',
              hasMany: true,
              required: true,
              label: label('Предлагаемые окна', 'Offered windows'),
              options: registryOptions('windowStyle', WINDOW_STYLES),
              defaultValue: [...WINDOW_STYLES],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'terraceDepths',
                  type: 'number',
                  hasMany: true,
                  min: TERRACE_DEPTH.min,
                  max: TERRACE_DEPTH.max,
                  label: label('Глубины террасы, мм', 'Terrace depths, mm'),
                  admin: {
                    width: '60%',
                    description: label(
                      'Собственная глубина террасы проекта предлагается всегда',
                      'The project’s own terrace depth is always offered',
                    ),
                  },
                },
                {
                  name: 'terraceRemovable',
                  type: 'checkbox',
                  defaultValue: true,
                  label: label('Можно отказаться от террасы', 'Terrace can be dropped'),
                  admin: { width: '40%' },
                },
              ],
            },
          ],
        },
        {
          label: label('Инженерия', 'Building services'),
          fields: [
            {
              name: 'engineeringSystems',
              type: 'array',
              label: label('Инженерные системы', 'Building services'),
              labels: {
                singular: label('Система', 'System'),
                plural: label('Системы', 'Systems'),
              },
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
                {
                  name: 'requires',
                  type: 'text',
                  hasMany: true,
                  label: label('Требует систем (ключи)', 'Requires systems (keys)'),
                },
              ],
            },
          ],
        },
        {
          label: label('Правила совместимости', 'Compatibility rules'),
          description: label(
            'Сочетания, которые завод не строит. Конфигуратор не даст их выбрать и покажет пояснение.',
            'Combinations the factory does not build. The configurator blocks them and shows the explanation.',
          ),
          fields: [
            {
              name: 'rules',
              type: 'array',
              label: label('Правила', 'Rules'),
              labels: {
                singular: label('Правило', 'Rule'),
                plural: label('Правила', 'Rules'),
              },
              fields: [
                keyField(),
                conditionsField(label('Не сочетаются, когда', 'Not combined when'), 2),
                {
                  name: 'message',
                  type: 'textarea',
                  required: true,
                  localized: true,
                  label: label('Пояснение для покупателя', 'Explanation for the customer'),
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
