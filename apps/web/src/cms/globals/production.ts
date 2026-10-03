import type { GlobalConfig } from 'payload'

import { STAGE_ILLUSTRATIONS } from '@/modules/production/domain/production'

import { anyone, requireCapability } from '../access/policies'
import { label } from '../fields/labels'
import { registryOptions } from '../fields/registry-labels'

/** The production page: its heading and the stages from drawing to keys, each with a scheme. */
export const Production: GlobalConfig = {
  slug: 'production',
  label: label('О производстве', 'Production'),
  admin: { group: label('Контент', 'Content') },
  access: { read: anyone, update: requireCapability('content.write') },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: label('Заголовок', 'Title'),
      required: true,
      localized: true,
    },
    {
      name: 'lead',
      type: 'textarea',
      label: label('Подзаголовок', 'Lead'),
      required: true,
      localized: true,
    },
    {
      name: 'stages',
      type: 'array',
      label: label('Этапы', 'Stages'),
      labels: { singular: label('Этап', 'Stage'), plural: label('Этапы', 'Stages') },
      minRows: 1,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'illustration',
              type: 'select',
              label: label('Схема', 'Scheme'),
              required: true,
              options: registryOptions('stageIllustration', STAGE_ILLUSTRATIONS),
              admin: { width: '50%' },
            },
            {
              name: 'place',
              type: 'select',
              label: label('Где', 'Where'),
              required: true,
              defaultValue: 'workshop',
              options: [
                { value: 'workshop', label: label('В цеху', 'In the workshop') },
                { value: 'site', label: label('На участке', 'On site') },
              ],
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'title',
          type: 'text',
          label: label('Название', 'Title'),
          required: true,
          localized: true,
        },
        {
          name: 'text',
          type: 'textarea',
          label: label('Описание', 'Description'),
          required: true,
          localized: true,
        },
      ],
    },
  ],
}
