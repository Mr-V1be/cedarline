import { FACADE_FINISHES, ROOF_KIND_KEYS, WINDOW_STYLES } from '@kedrovnik/house'
import type { GroupField } from 'payload'

import { hexColorField, millimetres } from '../../fields/common'
import { label } from '../../fields/labels'
import { registryOptions } from '../../fields/registry-labels'

/** Default configuration of the project: what the catalog price and renders show. */
export const defaultsField: GroupField = {
  name: 'defaults',
  type: 'group',
  label: label('Базовая комплектация', 'Default configuration'),
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'roofKind',
          type: 'select',
          label: label('Кровля', 'Roof'),
          required: true,
          defaultValue: 'gable',
          options: registryOptions('roofKind', ROOF_KIND_KEYS),
          admin: { width: '33%' },
        },
        {
          name: 'roofPitch',
          type: 'number',
          label: label('Уклон, °', 'Pitch, °'),
          required: true,
          min: 1,
          max: 60,
          defaultValue: 30,
          admin: { width: '33%' },
        },
        millimetres('insulation', label('Утепление стен, мм', 'Wall insulation, mm'), {
          defaultValue: 150,
        }),
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'facadeFinish',
          type: 'select',
          label: label('Отделка фасада', 'Facade finish'),
          required: true,
          defaultValue: 'planken',
          options: registryOptions('facadeFinish', FACADE_FINISHES),
          admin: { width: '33%' },
        },
        {
          ...hexColorField('facadeColor', label('Цвет фасада', 'Facade colour')),
          admin: { width: '33%' },
        },
        {
          name: 'windowStyle',
          type: 'select',
          label: label('Окна', 'Windows'),
          required: true,
          defaultValue: 'standard',
          options: registryOptions('windowStyle', WINDOW_STYLES),
          admin: { width: '33%' },
        },
      ],
    },
    {
      name: 'engineering',
      type: 'text',
      hasMany: true,
      label: label('Инженерные системы (ключи)', 'Building services (keys)'),
      admin: {
        description: label(
          'Ключи систем из раздела «Опции каталога»',
          'System keys from “Catalog options”',
        ),
      },
    },
  ],
}
