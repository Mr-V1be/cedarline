import type { CollectionConfig } from 'payload'

import { requireCapability } from '../access/policies'
import { label } from '../fields/labels'

export const DOCUMENT_KINDS = ['render', 'proposal'] as const

/**
 * Files produced for customers: configuration renders and commercial proposals (PDF). Private:
 * only sales staff read them in the CMS; customers reach their own through the share code.
 */
export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: label('Файл', 'File'), plural: label('Файлы заявок', 'Lead files') },
  admin: {
    group: label('Продажи', 'Sales'),
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'kind', 'createdAt'],
  },
  access: {
    read: requireCapability('leads.read'),
    create: () => false,
    update: () => false,
    delete: requireCapability('leads.write'),
  },
  upload: {
    // Outside the public media directory: files are served only through access control.
    staticDir: 'documents',
    mimeTypes: ['application/pdf', 'image/jpeg'],
  },
  fields: [
    {
      name: 'kind',
      type: 'select',
      required: true,
      label: label('Вид', 'Kind'),
      options: [
        { value: 'render', label: label('Рендер конфигурации', 'Configuration render') },
        { value: 'proposal', label: label('Коммерческое предложение', 'Commercial proposal') },
      ],
      admin: { readOnly: true },
    },
  ],
}
