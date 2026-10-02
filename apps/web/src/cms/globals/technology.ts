import type { GlobalConfig } from 'payload'

import { LAYER_ROLES } from '@/modules/technology/domain/wall-assembly'

import { anyone, requireCapability } from '../access/policies'
import { keyField, millimetres } from '../fields/common'
import { label } from '../fields/labels'
import { registryOptions } from '../fields/registry-labels'
import type { Technology as TechnologyDocument } from '../generated/payload-types'
import { refreshProjectionsOnChange } from '../hooks/refresh-projections'

/** Wall assembly and insulation options: the section on the site and the wall of every house. */
export const Technology: GlobalConfig = {
  slug: 'technology',
  label: label('Технология', 'Technology'),
  admin: { group: label('Цены и сроки', 'Prices and schedule') },
  access: { read: anyone, update: requireCapability('catalog.write') },
  hooks: {
    afterChange: [
      refreshProjectionsOnChange<TechnologyDocument>(({ layers, insulationOptions }) => ({
        layers: (layers ?? []).map(({ role, thickness, conductivity }) => ({
          role,
          thickness,
          conductivity,
        })),
        insulation: (insulationOptions ?? []).map(({ thickness }) => thickness),
      })),
    ],
  },
  fields: [
    {
      name: 'layers',
      type: 'array',
      label: label('Слои стены снаружи внутрь', 'Wall layers, outside in'),
      labels: { singular: label('Слой', 'Layer'), plural: label('Слои', 'Layers') },
      minRows: 1,
      validate: (rows: unknown) =>
        Array.isArray(rows) &&
        rows.filter((row: { role?: string }) => row.role === 'insulation').length === 1
          ? true
          : 'Нужен ровно один слой утеплителя / exactly one insulation layer is required',
      fields: [
        {
          type: 'row',
          fields: [
            { ...keyField(), admin: { width: '25%' } },
            {
              name: 'name',
              type: 'text',
              label: label('Материал', 'Material'),
              required: true,
              localized: true,
              admin: { width: '45%' },
            },
            {
              name: 'role',
              type: 'select',
              label: label('Роль', 'Role'),
              required: true,
              options: registryOptions('layerRole', LAYER_ROLES),
              admin: { width: '30%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            millimetres('thickness', label('Толщина, мм', 'Thickness, mm')),
            {
              name: 'conductivity',
              type: 'number',
              label: label('Теплопроводность λ, Вт/(м·°C)', 'Conductivity λ, W/(m·°C)'),
              min: 0.001,
              admin: { width: '40%', step: 0.001 },
            },
          ],
        },
      ],
    },
    {
      name: 'insulationOptions',
      type: 'array',
      label: label('Варианты утепления стен', 'Wall insulation options'),
      minRows: 1,
      fields: [millimetres('thickness', label('Толщина, мм', 'Thickness, mm'), { min: 50 })],
    },
  ],
}
