import type { Field, NumberField, SelectField, TextField } from 'payload'

import { label, type Labels } from './labels'

const KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const HEX_COLOR = /^#[0-9a-f]{6}$/i

const validateKey = (value: unknown): true | string =>
  typeof value === 'string' && KEY_PATTERN.test(value)
    ? true
    : 'Только латиница в нижнем регистре, цифры и дефисы / lowercase latin, digits and hyphens'

/** URL slug: unique, indexed, kebab-case. */
export const slugField = (): TextField => ({
  name: 'slug',
  type: 'text',
  label: label('Адрес (slug)', 'Slug'),
  required: true,
  unique: true,
  index: true,
  validate: validateKey,
  admin: { position: 'sidebar' },
})

/** Stable machine key referenced from other data (tariff sections, systems, room kinds). */
export const keyField = (name = 'key', overrides: Partial<TextField> = {}): TextField => {
  const required = overrides.required ?? true
  return {
    name,
    type: 'text',
    label: label('Ключ', 'Key'),
    ...overrides,
    required,
    validate: (value: unknown) =>
      !required && (value === undefined || value === null || value === '')
        ? true
        : validateKey(value),
  } as TextField
}

export const titleField = (labels: Labels = label('Название', 'Title')): TextField => ({
  name: 'title',
  type: 'text',
  label: labels,
  required: true,
  localized: true,
})

export const publicationStatusField = (): SelectField => ({
  name: 'status',
  type: 'select',
  label: label('Статус', 'Status'),
  required: true,
  defaultValue: 'draft',
  index: true,
  options: [
    { value: 'draft', label: label('Черновик', 'Draft') },
    { value: 'published', label: label('Опубликован', 'Published') },
  ],
  admin: { position: 'sidebar' },
})

/** Whole millimetres, the unit of every authored length. */
export const millimetres = (
  name: string,
  labels: Labels,
  options: { min?: number; max?: number; required?: boolean; defaultValue?: number } = {},
): NumberField => ({
  name,
  type: 'number',
  label: labels,
  required: options.required ?? true,
  min: options.min ?? 0,
  ...(options.max === undefined ? {} : { max: options.max }),
  ...(options.defaultValue === undefined ? {} : { defaultValue: options.defaultValue }),
  validate: (value: number | null | undefined) =>
    value === null || value === undefined || Number.isInteger(value)
      ? true
      : 'Целое число мм / whole mm',
  admin: { step: 10, width: '25%' },
})

export const hexColorField = (name: string, labels: Labels): TextField => ({
  name,
  type: 'text',
  label: labels,
  required: true,
  validate: (value: unknown) =>
    typeof value === 'string' && HEX_COLOR.test(value) ? true : 'Формат #rrggbb / format #rrggbb',
})

/** Read-only field filled by projection hooks; editors see it but never type into it. */
export const projected = <T extends Field>(field: T): T => ({
  ...field,
  admin: { ...('admin' in field ? field.admin : {}), readOnly: true },
})
