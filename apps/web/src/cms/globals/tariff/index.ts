import { QUANTITY_DRIVER_KEYS } from '@kedrovnik/house'
import { ROUNDING_MODES } from '@kedrovnik/pricing'
import type { GlobalConfig, TextField } from 'payload'

import { anyone, requireCapability } from '../../access/policies'
import { keyField } from '../../fields/common'
import { label } from '../../fields/labels'
import { registryOptions } from '../../fields/registry-labels'
import type { Tariff as TariffDocument } from '../../generated/payload-types'
import { refreshProjectionsOnChange } from '../../hooks/refresh-projections'
import { bumpTariffRevision, tariffSubstance, validateTariff } from '../../hooks/tariff-hooks'
import { conditionsField } from '../../fields/condition-fields'

const name = (labels = label('Название', 'Name')): TextField => ({
  name: 'name',
  type: 'text',
  label: labels,
  required: true,
  localized: true,
})

const driverOptions = registryOptions('quantityDriver', QUANTITY_DRIVER_KEYS)

const keyList = (
  fieldName: string,
  labels: ReturnType<typeof label>,
  required = true,
): TextField => ({
  name: fieldName,
  type: 'text',
  hasMany: true,
  required,
  label: labels,
})

/**
 * Tariff grid: estimate sections, priced lines, completeness levels and schedule norms.
 * Every change bumps the revision and re-prices the catalog in the same transaction.
 */
export const Tariff: GlobalConfig = {
  slug: 'tariff',
  label: label('Тарифная сетка', 'Tariff grid'),
  admin: { group: label('Цены и сроки', 'Prices and schedule') },
  access: { read: anyone, update: requireCapability('pricing.write') },
  hooks: {
    beforeChange: [validateTariff, bumpTariffRevision],
    afterChange: [refreshProjectionsOnChange<TariffDocument>(tariffSubstance)],
  },
  fields: [
    {
      name: 'revision',
      type: 'number',
      label: label('Ревизия', 'Revision'),
      defaultValue: 0,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: label('Статьи сметы', 'Estimate sections'),
          fields: [
            {
              name: 'sections',
              type: 'array',
              label: label('Статьи', 'Sections'),
              labels: { singular: label('Статья', 'Section'), plural: label('Статьи', 'Sections') },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { ...keyField(), admin: { width: '30%' } },
                    { ...name(), admin: { width: '70%' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: label('Расценки', 'Rates'),
          fields: [
            {
              name: 'rates',
              type: 'array',
              label: label('Расценки', 'Rates'),
              labels: { singular: label('Расценка', 'Rate'), plural: label('Расценки', 'Rates') },
              admin: { initCollapsed: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      ...keyField('code', { label: label('Код', 'Code') }),
                      admin: { width: '30%' },
                    },
                    { ...name(), admin: { width: '70%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      ...keyField('section', { label: label('Статья (ключ)', 'Section (key)') }),
                      admin: { width: '30%' },
                    },
                    {
                      name: 'driver',
                      type: 'select',
                      label: label('Объём', 'Quantity'),
                      required: true,
                      options: driverOptions,
                      admin: { width: '40%' },
                    },
                    {
                      name: 'unitPrice',
                      type: 'number',
                      label: label('Цена за единицу, ₽', 'Unit price, ₽'),
                      required: true,
                      min: 0,
                      admin: { width: '30%', step: 100 },
                    },
                  ],
                },
                conditionsField(),
              ],
            },
          ],
        },
        {
          label: label('Комплектации', 'Completeness'),
          fields: [
            {
              name: 'completeness',
              type: 'array',
              label: label('Комплектации', 'Completeness levels'),
              labels: {
                singular: label('Комплектация', 'Level'),
                plural: label('Комплектации', 'Levels'),
              },
              minRows: 1,
              fields: [
                {
                  type: 'row',
                  fields: [
                    { ...keyField(), admin: { width: '30%' } },
                    { ...name(), admin: { width: '70%' } },
                  ],
                },
                keyList('sections', label('Статьи в объёме (ключи)', 'Sections in scope (keys)')),
              ],
            },
          ],
        },
        {
          label: label('Витрина', 'Storefront'),
          fields: [
            {
              name: 'advertisedRounding',
              type: 'group',
              label: label('Округление «цены от»', 'Rounding of “price from”'),
              admin: {
                description: label(
                  'Подробные сметы всегда точные; правило действует только на рекламную цену «от».',
                  'Detailed estimates stay exact; the rule applies only to the advertised “price from”.',
                ),
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'step',
                      type: 'number',
                      label: label('Шаг, ₽', 'Step, ₽'),
                      required: true,
                      min: 1,
                      defaultValue: 1000,
                      admin: { width: '50%' },
                    },
                    {
                      name: 'mode',
                      type: 'select',
                      label: label('Направление', 'Direction'),
                      required: true,
                      defaultValue: 'up',
                      options: registryOptions('roundingMode', ROUNDING_MODES),
                      admin: { width: '50%' },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: label('Сроки', 'Schedule'),
          fields: [
            {
              name: 'workingDaysPerWeek',
              type: 'number',
              label: label('Рабочих дней в неделе', 'Working days per week'),
              required: true,
              min: 1,
              max: 7,
              defaultValue: 5,
            },
            {
              name: 'phases',
              type: 'array',
              label: label('Фазы', 'Phases'),
              labels: { singular: label('Фаза', 'Phase'), plural: label('Фазы', 'Phases') },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { ...keyField(), admin: { width: '30%' } },
                    { ...name(), admin: { width: '70%' } },
                  ],
                },
              ],
            },
            {
              name: 'stages',
              type: 'array',
              label: label('Этапы', 'Stages'),
              labels: { singular: label('Этап', 'Stage'), plural: label('Этапы', 'Stages') },
              admin: { initCollapsed: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { ...keyField(), admin: { width: '30%' } },
                    { ...name(), admin: { width: '70%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      ...keyField('phase', { label: label('Фаза (ключ)', 'Phase (key)') }),
                      admin: { width: '25%' },
                    },
                    {
                      ...keyField('section', {
                        label: label('Статья (ключ)', 'Section (key)'),
                        required: false,
                      }),
                      admin: { width: '25%' },
                    },
                    {
                      name: 'driver',
                      type: 'select',
                      label: label('Объём', 'Quantity'),
                      options: driverOptions,
                      admin: { width: '50%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'baseDays',
                      type: 'number',
                      label: label('Дней базово', 'Base days'),
                      required: true,
                      min: 0,
                      admin: { width: '25%' },
                    },
                    {
                      name: 'daysPerUnit',
                      type: 'number',
                      label: label('Дней на единицу', 'Days per unit'),
                      required: true,
                      min: 0,
                      defaultValue: 0,
                      admin: { width: '25%', step: 0.01 },
                    },
                    {
                      ...keyList(
                        'dependsOn',
                        label('После этапов (ключи)', 'After stages (keys)'),
                        false,
                      ),
                      admin: { width: '50%' },
                    },
                  ],
                },
                conditionsField(),
              ],
            },
          ],
        },
      ],
    },
  ],
}
