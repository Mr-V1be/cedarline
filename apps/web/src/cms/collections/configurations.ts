import type { CollectionConfig } from 'payload'

import { LOCALES } from '@/i18n/locales'

import { declareReadCapability, requireCapability } from '../access/policies'
import { label } from '../fields/labels'
import { rublesField } from '../fields/rubles'

const SALES_READ = 'leads.read'

/**
 * Configurations saved by customers. The short code is the only key a customer knows; the
 * snapshot keeps exactly what they saw: the house, the estimate, the schedule and the tariff
 * revision. Created only by the site; sales staff read them next to leads.
 */
export const Configurations: CollectionConfig = {
  slug: 'configurations',
  labels: {
    singular: label('Конфигурация', 'Configuration'),
    plural: label('Конфигурации', 'Configurations'),
  },
  admin: {
    group: label('Продажи', 'Sales'),
    useAsTitle: 'code',
    defaultColumns: ['code', 'project', 'total', 'tariffRevision', 'createdAt'],
  },
  defaultSort: '-createdAt',
  custom: declareReadCapability(SALES_READ),
  access: {
    read: requireCapability(SALES_READ),
    create: () => false,
    update: () => false,
    delete: requireCapability('leads.write'),
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: label('Код ссылки', 'Link code'),
      admin: { readOnly: true },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'project',
          type: 'relationship',
          relationTo: 'projects',
          label: label('Проект', 'Project'),
          admin: { readOnly: true, width: '40%' },
        },
        rublesField({ name: 'total', label: label('Сумма', 'Total'), width: '20%' }),
        {
          name: 'tariffRevision',
          type: 'number',
          label: label('Ревизия тарифа', 'Tariff revision'),
          admin: { readOnly: true, width: '20%' },
        },
        {
          name: 'locale',
          type: 'select',
          label: label('Язык', 'Language'),
          options: LOCALES.map((locale) => ({ value: locale, label: locale.toUpperCase() })),
          admin: { readOnly: true, width: '20%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'render',
          type: 'upload',
          relationTo: 'documents',
          label: label('Рендер', 'Render'),
          admin: { readOnly: true, width: '50%' },
        },
        {
          name: 'proposal',
          type: 'upload',
          relationTo: 'documents',
          label: label('КП (PDF)', 'Proposal (PDF)'),
          admin: { readOnly: true, width: '50%' },
        },
      ],
    },
    {
      name: 'configuration',
      type: 'json',
      required: true,
      label: label('Выбор покупателя', 'Customer choices'),
      admin: { readOnly: true },
    },
    {
      name: 'snapshot',
      type: 'json',
      required: true,
      label: label('Снимок: дом, смета, график', 'Snapshot: house, estimate, schedule'),
      admin: { readOnly: true },
    },
  ],
}
