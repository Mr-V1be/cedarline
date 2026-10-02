import type { GlobalConfig } from 'payload'

import { anyone, requireCapability } from '../access/policies'
import { label } from '../fields/labels'

/** Company details shown in the footer and, later, on the contacts page. */
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
  ],
}
