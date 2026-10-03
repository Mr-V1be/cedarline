import type { GlobalConfig } from 'payload'

import { anyone, requireCapability, userCan } from '../access/policies'
import { label } from '../fields/labels'

/** Company details: the footer, the contacts page and the personal data policy read them. */
export const Site: GlobalConfig = {
  slug: 'site',
  label: label('Компания', 'Company'),
  admin: { group: label('Контент', 'Content') },
  access: { read: anyone, update: requireCapability('content.write') },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'phone', type: 'text', label: label('Телефон', 'Phone'), required: true },
        { name: 'email', type: 'email', label: label('Почта', 'Email'), required: true },
      ],
    },
    {
      name: 'leadsEmail',
      type: 'email',
      required: true,
      label: label('Почта для заявок', 'Leads inbox'),
      // Internal address: the public site never shows it, staff and the server read it.
      access: {
        read: ({ req }) => userCan(req.user, 'content.write') || userCan(req.user, 'leads.read'),
      },
      admin: {
        description: label(
          'Сюда приходят уведомления о новых заявках с конфигурацией и КП',
          'New leads with their configuration and proposal are sent here',
        ),
      },
    },
    {
      name: 'address',
      type: 'text',
      label: label('Адрес производства', 'Factory address'),
      required: true,
      localized: true,
    },
    {
      name: 'hours',
      type: 'text',
      label: label('Часы работы', 'Opening hours'),
      required: true,
      localized: true,
    },
    {
      name: 'region',
      type: 'text',
      label: label('Регион строительства', 'Building region'),
      required: true,
      localized: true,
    },
    {
      name: 'location',
      type: 'point',
      label: label('Производство на карте', 'Factory on the map'),
      admin: {
        description: label(
          'Без координат страница контактов обходится без карты',
          'Without coordinates the contacts page shows no map',
        ),
      },
    },
    {
      type: 'collapsible',
      label: label('Реквизиты и персональные данные', 'Legal details and personal data'),
      fields: [
        {
          name: 'legalName',
          type: 'text',
          label: label('Юридическое название', 'Legal name'),
          required: true,
          localized: true,
        },
        {
          type: 'row',
          fields: [
            { name: 'taxId', type: 'text', label: label('ИНН', 'Taxpayer number'), required: true },
            {
              name: 'registrationNumber',
              type: 'text',
              label: label('ОГРН', 'Registration number'),
              required: true,
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'privacyEmail',
              type: 'email',
              label: label('Почта по персональным данным', 'Personal data contact'),
              required: true,
            },
            {
              name: 'privacyEdition',
              type: 'date',
              label: label('Редакция политики от', 'Policy version date'),
              required: true,
              admin: { date: { pickerAppearance: 'dayOnly' } },
            },
          ],
        },
      ],
    },
  ],
}
