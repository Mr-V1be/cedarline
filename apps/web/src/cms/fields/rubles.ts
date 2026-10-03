import type { NumberField } from 'payload'

import type { Labels } from './labels'

/**
 * A computed sum in whole rubles: stored as a number, shown in the CMS as the site shows it
 * («2 690 732 ₽») in the document and in the list. Staff never type it, so it is read-only.
 */
export const rublesField = ({
  name,
  label,
  index = false,
  width,
}: {
  readonly name: string
  readonly label: Labels
  readonly index?: boolean
  readonly width?: string
}): NumberField => ({
  name,
  type: 'number',
  label,
  index,
  admin: {
    readOnly: true,
    ...(width === undefined ? {} : { width }),
    components: {
      Field: '/cms/admin/rubles#RublesField',
      Cell: '/cms/admin/rubles#RublesCell',
    },
  },
})
