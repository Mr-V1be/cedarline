import { SELECTION_OPTIONS } from '@kedrovnik/configurator'
import type { ArrayField } from 'payload'

import { label, type Labels } from './labels'
import { registryOptions } from './registry-labels'

const VALUES_HELP = label(
  'Значения: этажность — 1, 1-attic, 2; планировка — base, mirrored; кровля — gable, shed, gambrel; ' +
    'фасад — timber-imitation, planken, fiber-cement; окна — standard, panoramic; терраса — глубина в мм ' +
    '(0 — без террасы); утепление — толщина в мм; инженерия — ключи систем.',
  'Values: storeys — 1, 1-attic, 2; plan — base, mirrored; roof — gable, shed, gambrel; facade — ' +
    'timber-imitation, planken, fiber-cement; windows — standard, panoramic; terrace — depth in mm ' +
    '(0 — none); insulation — thickness in mm; building services — system keys.',
)

/** Conditions on the configuration: all of them hold when the option has any of the values. */
export const conditionsField = (
  labels: Labels = label('Условия применения', 'Applies when'),
  minRows = 0,
): ArrayField => ({
  name: 'conditions',
  type: 'array',
  label: labels,
  labels: { singular: label('Условие', 'Condition'), plural: label('Условия', 'Conditions') },
  minRows,
  admin: { initCollapsed: minRows === 0, description: VALUES_HELP },
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
})
