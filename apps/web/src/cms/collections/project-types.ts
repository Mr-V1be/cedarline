import type { CollectionConfig } from 'payload'

import { anyone, requireCapability } from '../access/policies'
import { slugField, titleField } from '../fields/common'
import { label } from '../fields/labels'

/** Kinds of buildings in the catalog (дом, баня, гостевой дом); filters list them from here. */
export const ProjectTypes: CollectionConfig = {
  slug: 'project-types',
  labels: {
    singular: label('Тип проекта', 'Project type'),
    plural: label('Типы проектов', 'Project types'),
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'order'],
    group: label('Каталог', 'Catalog'),
  },
  defaultSort: 'order',
  access: {
    read: anyone,
    create: requireCapability('catalog.write'),
    update: requireCapability('catalog.write'),
    delete: requireCapability('catalog.write'),
  },
  fields: [
    titleField(),
    slugField(),
    {
      name: 'order',
      type: 'number',
      label: label('Порядок', 'Order'),
      required: true,
      defaultValue: 100,
      index: true,
    },
  ],
}
