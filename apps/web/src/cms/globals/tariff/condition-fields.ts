import type { ArrayField } from 'payload'

import { SELECTION_OPTIONS } from '@/modules/pricing/domain/selections'

import { label } from '../../fields/labels'
import { registryOptions } from '../../fields/registry-labels'

/** Applicability conditions: the line applies when every condition holds. */
export const conditionsField: ArrayField = {
  name: 'conditions',
  type: 'array',
  label: label('Условия применения', 'Applies when'),
  labels: { singular: label('Условие', 'Condition'), plural: label('Условия', 'Conditions') },
  admin: { initCollapsed: true },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'option',
          type: 'select',
          label: label('Опция', 'Option'),
          required: true,
          options: registryOptions('selectionOption', SELECTION_OPTIONS),
          admin: { width: '40%' },
        },
        {
          name: 'values',
          type: 'text',
          hasMany: true,
          required: true,
          label: label('Любое из значений', 'Any of the values'),
          admin: { width: '60%' },
        },
      ],
    },
  ],
}
