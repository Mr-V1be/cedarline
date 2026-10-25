import type { CollectionConfig, Field } from 'payload'

import { LOCALES } from '@/i18n/locales'
import { LEAD_STATUSES } from '@/modules/leads/domain/lead'
import { CURRENCY_CODES } from '@/modules/pricing/domain/currencies'

import { declareReadCapability, requireCapability } from '../access/policies'
import { retryLeadDelivery } from '../endpoints/retry-lead-delivery'
import { DAY_WITH_YEAR } from '../fields/common'
import { label } from '../fields/labels'
import { registryOptions } from '../fields/registry-labels'
import { inRubles, rublesField } from '../fields/rubles'

const SALES_READ = 'leads.read'

/** Rate fields mean something only for a converted currency; a ruble lead has none. */
const whenConverted = (_: unknown, siblingData: { rate?: unknown } | undefined) =>
  typeof siblingData?.rate === 'number'

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
  custom: declareReadCapability(SALES_READ),
  endpoints: [{ path: '/:id/deliveries/retry', method: 'post', handler: retryLeadDelivery }],
  access: {
    read: requireCapability(SALES_READ),
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
        sent(rublesField({ name: 'total', label: label('Сумма', 'Total') })),
        sent({
          name: 'locale',
          type: 'select',
          label: label('Язык', 'Language'),
          options: LOCALES.map((locale) => ({ value: locale, label: locale.toUpperCase() })),
        }),
      ],
    },
    {
      // The total above is the tariff's rubles; this is what the customer read on the site.
      name: 'display',
      type: 'group',
      label: label('Цены у клиента', 'Prices as the customer saw them'),
      fields: [
        {
          type: 'row',
          fields: [
            sent({
              name: 'currency',
              type: 'select',
              required: true,
              label: label('Валюта', 'Currency'),
              options: CURRENCY_CODES.map((code) => ({ value: code, label: code })),
              admin: { width: '20%' },
            }),
            sent({
              name: 'rate',
              type: 'number',
              label: inRubles(label('Курс за 1 единицу', 'Rate per unit')),
              admin: { width: '25%', condition: whenConverted },
            }),
            sent({
              name: 'rateSetOn',
              type: 'date',
              label: label('Курс установлен', 'Rate set on'),
              admin: {
                width: '25%',
                condition: whenConverted,
                date: DAY_WITH_YEAR,
              },
            }),
            {
              name: 'amount',
              type: 'ui',
              label: label('Сумма у клиента', 'Total the customer saw'),
              admin: {
                width: '30%',
                components: { Field: '/cms/admin/customer-price#CustomerPrice' },
              },
            },
          ],
        },
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
    {
      // Channels the lead has not reached, with a manual retry, beside the status.
      name: 'deliveryActions',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '/cms/admin/lead-deliveries#LeadDeliveries' },
      },
    },
  ],
}
