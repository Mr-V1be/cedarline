import type { GroupField } from 'payload'

import { millimetres } from '../../fields/common'
import { label } from '../../fields/labels'

/** Footprint limits of the factory line, mm (same as the design's). */
const FOOTPRINT = { min: 3000, max: 24000 } as const

/** What the configurator may vary for this project besides the catalog-wide options. */
export const configuratorField: GroupField = {
  name: 'configurator',
  type: 'group',
  label: label('Конфигуратор', 'Configurator'),
  fields: [
    {
      name: 'variantOf',
      type: 'relationship',
      relationTo: 'projects',
      label: label('Вариант этажности проекта', 'Storey variant of'),
      // `id` is absent while a new project is being created.
      filterOptions: ({ id }) => {
        const current: unknown = id
        return current === undefined ? true : { id: { not_equals: id } }
      },
      admin: {
        description: label(
          'Проекты одной серии с другой этажностью: в конфигураторе они переключаются шагом «Этажность». Укажите основной проект серии.',
          'Projects of one series with other storeys: the configurator switches between them in the “Storeys” step. Point to the main project of the series.',
        ),
      },
    },
    {
      name: 'mirrorable',
      type: 'checkbox',
      defaultValue: true,
      label: label('Предлагать зеркальную планировку', 'Offer the mirrored plan'),
    },
    {
      name: 'sizes',
      type: 'array',
      label: label('Другие габариты', 'Other footprints'),
      labels: { singular: label('Габарит', 'Footprint'), plural: label('Габариты', 'Footprints') },
      admin: {
        description: label(
          'Помещения масштабируются по осям, окна и двери сохраняют размер. Каждый габарит проверяется при сохранении.',
          'Rooms scale on the axis grid, windows and doors keep their size. Every footprint is checked on save.',
        ),
      },
      fields: [
        {
          type: 'row',
          fields: [
            millimetres('width', label('Ширина, мм', 'Width, mm'), FOOTPRINT),
            millimetres('depth', label('Глубина, мм', 'Depth, mm'), FOOTPRINT),
          ],
        },
      ],
    },
  ],
}
