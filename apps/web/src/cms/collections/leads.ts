import type { CollectionConfig, Field } from 'payload'

import { LOCALES } from '@/i18n/locales'
import { LEAD_STATUSES } from '@/modules/leads/domain/lead'

import { requireCapability } from '../access/policies'
import { label } from '../fields/labels'
import { registryOptions } from '../fields/registry-labels'

/** What the customer sent stays as sent: staff change only the status and their notes. */
const sent = (field: Field): Field =>
  ({
    ...field,
    access: { create: () => false, update: () => false },
    admin: { ...('admin' in field ? field.admin : {}), readOnly: true },
  }) as Field

/**
 * Leads from the configurator: the contact, the configuration with its proposal and the
 * delivery log (CRM, emails). Written by the site through the CMS lead sink, worked by sales.
 */
export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: label('Заявка', 'Lead'), plural: label('Заявки', 'Leads') },
  admin: {
    group: label('Продажи', 'Sales'),
    useAsTitle: 'name',
    defaultColumns: ['id', 'name', 'phone', 'summary', 'total', 'status', 'createdAt'],
  },
  defaultSort: '-createdAt',
  access: {
    read: requireCapability('leads.read'),
    create: () => false,
    update: requireCapability('leads.write'),
    delete: requireCapability('leads.write'),
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      index: true,
      label: label('Статус', 'Status'),
      options: registryOptions('leadStatus', LEAD_STATUSES),
      admin: { position: 'sidebar' },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: label('Заметки менеджера', 'Manager notes'),
      admin: { position: 'sidebar' },
    },
    {
      type: 'row',
      fields: [
        sent({ name: 'name', type: 'text', required: true, label: label('Имя', 'Name') }),
        sent({ name: 'phone', type: 'text', required: true, label: label('Телефон', 'Phone') }),
        sent({ name: 'email', type: 'email', required: true, label: label('Почта', 'Email') }),
      ],
    },
    sent({ name: 'comment', type: 'textarea', label: label('Комментарий', 'Comment') }),
    sent({
      name: 'link',
      type: 'text',
      label: label('Конфигурация на сайте', 'Configuration on the site'),
      admin: {
        description: label(
          'Открывает конфигурацию такой, какой её видел клиент',
          'Opens the configuration exactly as the customer saw it',
        ),
      },
    }),
    {
      type: 'row',
      fields: [
        sent({
          name: 'summary',
          type: 'text',
          label: label('Конфигурация', 'Configuration'),
        }),
        sent({ name: 'total', type: 'number', label: label('Сумма, ₽', 'Total, ₽') }),
        sent({
          name: 'locale',
          type: 'select',
          label: label('Язык', 'Language'),
          options: LOCALES.map((locale) => ({ value: locale, label: locale.toUpperCase() })),
        }),
      ],
    },
    {
      type: 'row',
      fields: [
        sent({
          name: 'configuration',
          type: 'relationship',
          relationTo: 'configurations',
          label: label('Сохранённая конфигурация', 'Saved configuration'),
        }),
        sent({
          name: 'project',
          type: 'relationship',
          relationTo: 'projects',
          label: label('Проект', 'Project'),
        }),
        sent({
          name: 'proposal',
          type: 'upload',
          relationTo: 'documents',
          label: label('КП (PDF)', 'Proposal (PDF)'),
        }),
      ],
    },
    sent({
      name: 'consentAt',
      type: 'date',
      label: label('Согласие на обработку данных', 'Personal data consent'),
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    }),
    sent({
      name: 'deliveries',
      type: 'array',
      label: label('Доставка заявки', 'Delivery log'),
      labels: { singular: label('Запись', 'Entry'), plural: label('Записи', 'Entries') },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'channel', type: 'text', required: true, label: label('Канал', 'Channel') },
            {
              name: 'status',
              type: 'select',
              required: true,
              label: label('Итог', 'Outcome'),
              options: [
                { value: 'delivered', label: label('Доставлено', 'Delivered') },
                { value: 'failed', label: label('Ошибка', 'Failed') },
              ],
            },
            {
              name: 'reference',
              type: 'text',
              label: label('Номер во внешней системе', 'Reference'),
            },
            { name: 'at', type: 'date', required: true, label: label('Когда', 'When') },
          ],
        },
        { name: 'error', type: 'text', label: label('Ошибка', 'Error') },
      ],
    }),
  ],
}
