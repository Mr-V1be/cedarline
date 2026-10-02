import { GALLERY_VIEWS } from '@/modules/catalog/domain/project'
import type { CollectionConfig } from 'payload'

import { publishedOr, requireCapability } from '../../access/policies'
import { publicationStatusField, slugField, titleField } from '../../fields/common'
import { label } from '../../fields/labels'
import { registryOptions } from '../../fields/registry-labels'
import { applyProjectProjection } from '../../hooks/project-projection'
import { configuratorField } from './configurator-fields'
import { designField } from './design-fields'
import { defaultsField } from './option-fields'
import { metricsField, pricingField } from './projection-fields'

export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: label('Проект', 'Project'), plural: label('Проекты', 'Projects') },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'status', 'metrics.totalArea', 'pricing.fromPrice'],
    group: label('Каталог', 'Catalog'),
  },
  defaultSort: 'sortOrder',
  access: {
    read: publishedOr('catalog.write'),
    create: requireCapability('catalog.write'),
    update: requireCapability('catalog.write'),
    delete: requireCapability('catalog.write'),
  },
  hooks: { beforeChange: [applyProjectProjection] },
  fields: [
    titleField(),
    slugField(),
    publicationStatusField(),
    {
      name: 'sortOrder',
      type: 'number',
      label: label('Порядок в каталоге', 'Catalog order'),
      required: true,
      defaultValue: 100,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'type',
      type: 'relationship',
      relationTo: 'project-types',
      label: label('Тип', 'Type'),
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: label('Описание', 'Description'),
          fields: [
            {
              name: 'summary',
              type: 'textarea',
              label: label('Коротко о проекте', 'Summary'),
              required: true,
              localized: true,
            },
            {
              name: 'gallery',
              type: 'array',
              label: label('Галерея', 'Gallery'),
              labels: {
                singular: label('Изображение', 'Image'),
                plural: label('Изображения', 'Images'),
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'image',
                      type: 'upload',
                      relationTo: 'media',
                      label: label('Изображение', 'Image'),
                      required: true,
                      admin: { width: '70%' },
                    },
                    {
                      name: 'view',
                      type: 'select',
                      label: label('Ракурс', 'View'),
                      required: true,
                      defaultValue: 'front',
                      options: registryOptions('galleryView', GALLERY_VIEWS),
                      admin: { width: '30%' },
                    },
                  ],
                },
              ],
            },
          ],
        },
        { label: label('Конструкция', 'Structure'), fields: [designField] },
        { label: label('Комплектация', 'Configuration'), fields: [defaultsField] },
        { label: label('Конфигуратор', 'Configurator'), fields: [configuratorField] },
        { label: label('Расчёт', 'Computed'), fields: [metricsField, pricingField] },
      ],
    },
  ],
}
