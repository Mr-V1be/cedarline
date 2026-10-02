import type { CollectionConfig } from 'payload'

import { anyone, requireCapability } from '../access/policies'
import { keyField, titleField } from '../fields/common'
import { label } from '../fields/labels'
import type { RoomKind } from '../generated/payload-types'
import { refreshProjectionsOnChange } from '../hooks/refresh-projections'

/** Room kinds and their traits: bedrooms are counted for filters, wet zones for plumbing. */
export const RoomKinds: CollectionConfig = {
  slug: 'room-kinds',
  labels: {
    singular: label('Тип помещения', 'Room kind'),
    plural: label('Типы помещений', 'Room kinds'),
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'key', 'bedroom', 'wetZone', 'stair'],
    group: label('Каталог', 'Catalog'),
  },
  access: {
    read: anyone,
    create: requireCapability('catalog.write'),
    update: requireCapability('catalog.write'),
    delete: requireCapability('catalog.write'),
  },
  hooks: {
    afterChange: [
      refreshProjectionsOnChange<RoomKind>(({ key, bedroom, wetZone, stair }) => ({
        key,
        bedroom,
        wetZone,
        stair,
      })),
    ],
  },
  fields: [
    titleField(),
    keyField('key', { unique: true, index: true }),
    {
      type: 'row',
      fields: [
        {
          name: 'bedroom',
          type: 'checkbox',
          label: label('Спальня', 'Bedroom'),
          defaultValue: false,
        },
        {
          name: 'wetZone',
          type: 'checkbox',
          label: label('Мокрая зона', 'Wet room'),
          defaultValue: false,
        },
        { name: 'stair', type: 'checkbox', label: label('Лестница', 'Stair'), defaultValue: false },
      ],
    },
  ],
}
