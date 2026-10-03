import type { Field, GroupField } from 'payload'

import { projected } from '../../fields/common'
import { label } from '../../fields/labels'
import { rublesField } from '../../fields/rubles'

const number = (name: string, labels: ReturnType<typeof label>, index = false): Field =>
  projected({ name, type: 'number', label: labels, index, admin: { width: '25%' } })

/** Characteristics measured from the design; filled by the projection hook only. */
export const metricsField: GroupField = {
  name: 'metrics',
  type: 'group',
  label: label('Характеристики (расчёт)', 'Characteristics (computed)'),
  admin: {
    description: label(
      'Считаются из конструкции при сохранении',
      'Computed from the design on save',
    ),
  },
  fields: [
    {
      type: 'row',
      fields: [
        number('totalArea', label('Общая площадь, м²', 'Total area, m²'), true),
        number('terraceArea', label('Терраса, м²', 'Terrace, m²')),
        number('bedrooms', label('Спальни', 'Bedrooms'), true),
        number('wetZones', label('Санузлы и мокрые зоны', 'Wet rooms')),
      ],
    },
    {
      type: 'row',
      fields: [
        number('levels', label('Уровней', 'Levels')),
        number('storeys', label('Этажей', 'Storeys')),
        projected({ name: 'attic', type: 'checkbox', label: label('Мансарда', 'Attic') }),
        projected({
          name: 'storeyType',
          type: 'text',
          label: label('Этажность', 'Storey type'),
          index: true,
        }),
      ],
    },
    {
      type: 'row',
      fields: [
        number('width', label('Ширина, м', 'Width, m')),
        number('depth', label('Глубина, м', 'Depth, m')),
        number('ridgeHeight', label('Высота в коньке, м', 'Ridge height, m')),
      ],
    },
  ],
}

/** Lowest price over completeness levels; filled by the projection hook only. */
export const pricingField: GroupField = {
  name: 'pricing',
  type: 'group',
  label: label('Цена от (расчёт)', 'Price from (computed)'),
  fields: [
    {
      type: 'row',
      fields: [
        projected(
          rublesField({
            name: 'fromPrice',
            label: label('Цена от', 'Price from'),
            index: true,
            width: '25%',
          }),
        ),
        projected({
          name: 'fromCompleteness',
          type: 'text',
          label: label('Комплектация', 'Completeness'),
        }),
        number('totalWeeks', label('Срок, недель', 'Duration, weeks')),
        number('tariffRevision', label('Ревизия тарифа', 'Tariff revision')),
      ],
    },
  ],
}
