import type { CollectionConfig } from 'payload'

import { publishedOr, requireCapability } from '../access/policies'
import { publicationStatusField, slugField, titleField } from '../fields/common'
import { label } from '../fields/labels'

const FIRST_YEAR = 2000
const LAST_YEAR = 2100

/** Houses that have been built: shown on the home page and, later, on the map. */
export const BuiltObjects: CollectionConfig = {
  slug: 'built-objects',
  labels: {
    singular: label('Построенный объект', 'Built house'),
    plural: label('Построенные объекты', 'Built houses'),
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'settlement', 'year', 'status'],
    group: label('Каталог', 'Catalog'),
  },
  defaultSort: '-year',
  access: {
    read: publishedOr('catalog.write'),
    create: requireCapability('catalog.write'),
    update: requireCapability('catalog.write'),
    delete: requireCapability('catalog.write'),
  },
  fields: [
    titleField(),
    slugField(),
    publicationStatusField(),
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      label: label('Проект', 'Project'),
      index: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'settlement',
          type: 'text',
          label: label('Населённый пункт', 'Settlement'),
          required: true,
          localized: true,
        },
        {
          name: 'region',
          type: 'text',
          label: label('Регион', 'Region'),
          required: true,
          localized: true,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'year',
          type: 'number',
          label: label('Год', 'Year'),
          required: true,
          min: FIRST_YEAR,
          max: LAST_YEAR,
          index: true,
        },
        {
          name: 'area',
          type: 'number',
          label: label('Площадь, м²', 'Area, m²'),
          required: true,
          min: 1,
        },
      ],
    },
    { name: 'location', type: 'point', label: label('Координаты', 'Coordinates'), required: true },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: label('Обложка', 'Cover'),
      required: true,
    },
  ],
}
