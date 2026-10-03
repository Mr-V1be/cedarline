import {
  DOOR_ORIENTATIONS,
  MAX_STOREYS,
  OPENING_TYPES,
  RIDGE_AXES,
  TERRACE_REACHES,
  WALL_SIDES,
  WINDOW_ROLES,
} from '@kedrovnik/house'
import type { Field, GroupField } from 'payload'

import { keyField, millimetres } from '../../fields/common'
import { label } from '../../fields/labels'
import { registryOptions } from '../../fields/registry-labels'

/** Footprint limits of the factory line, mm. */
const FOOTPRINT = { min: 3000, max: 24000 } as const
const STOREY_HEIGHT = { min: 2300, max: 3600, default: 2800 } as const

const level = (): Field => ({
  name: 'level',
  type: 'number',
  label: label('Уровень (0 — первый этаж)', 'Level (0 is the ground floor)'),
  required: true,
  min: 0,
  defaultValue: 0,
  admin: { width: '25%' },
})

const rooms: Field = {
  name: 'rooms',
  type: 'array',
  label: label('Помещения', 'Rooms'),
  labels: { singular: label('Помещение', 'Room'), plural: label('Помещения', 'Rooms') },
  fields: [
    {
      type: 'row',
      fields: [
        keyField('key', { admin: { width: '25%' } }),
        {
          name: 'kind',
          type: 'relationship',
          relationTo: 'room-kinds',
          label: label('Тип', 'Kind'),
          required: true,
          admin: { width: '50%' },
        },
        level(),
      ],
    },
    {
      type: 'row',
      fields: [
        millimetres('x', label('X по осям, мм', 'X on axes, mm')),
        millimetres('y', label('Y по осям, мм', 'Y on axes, mm')),
        millimetres('width', label('Ширина, мм', 'Width, mm'), { min: 1 }),
        millimetres('depth', label('Глубина, мм', 'Depth, mm'), { min: 1 }),
      ],
    },
  ],
}

const openings: Field = {
  name: 'openings',
  type: 'array',
  label: label('Окна и наружные двери', 'Windows and exterior doors'),
  labels: { singular: label('Проём', 'Opening'), plural: label('Проёмы', 'Openings') },
  fields: [
    {
      type: 'row',
      fields: [
        keyField('key', { admin: { width: '25%' } }),
        {
          name: 'type',
          type: 'select',
          label: label('Тип', 'Type'),
          required: true,
          defaultValue: 'window',
          options: registryOptions('openingType', OPENING_TYPES),
          admin: { width: '25%' },
        },
        {
          name: 'role',
          type: 'select',
          label: label('Назначение', 'Role'),
          required: true,
          defaultValue: 'standard',
          options: registryOptions('windowRole', WINDOW_ROLES),
          admin: { width: '25%' },
        },
        level(),
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'side',
          type: 'select',
          label: label('Стена', 'Wall'),
          required: true,
          options: registryOptions('wallSide', WALL_SIDES),
          admin: { width: '25%' },
        },
        millimetres(
          'offset',
          label('Отступ от левого угла, мм', 'Offset from the left corner, mm'),
        ),
        millimetres('width', label('Ширина, мм', 'Width, mm'), { min: 1 }),
        millimetres('height', label('Высота, мм', 'Height, mm'), { min: 1 }),
      ],
    },
    {
      type: 'row',
      fields: [
        millimetres('sill', label('Низ проёма от пола, мм', 'Sill above floor, mm')),
        millimetres(
          'panoramicWidth',
          label('Ширина в панорамном варианте, мм', 'Panoramic width, mm'),
          { required: false, min: 1 },
        ),
      ],
    },
  ],
}

const doors: Field = {
  name: 'doors',
  type: 'array',
  label: label('Межкомнатные двери', 'Interior doors'),
  labels: { singular: label('Дверь', 'Door'), plural: label('Двери', 'Doors') },
  fields: [
    {
      type: 'row',
      fields: [
        keyField('key', { admin: { width: '25%' } }),
        level(),
        {
          name: 'orientation',
          type: 'select',
          label: label('Стена', 'Wall'),
          required: true,
          options: registryOptions('doorOrientation', DOOR_ORIENTATIONS),
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        millimetres('x', label('Центр X, мм', 'Centre X, mm')),
        millimetres('y', label('Центр Y, мм', 'Centre Y, mm')),
        millimetres('width', label('Ширина, мм', 'Width, mm'), { min: 1 }),
      ],
    },
  ],
}

const enabledOnly = (_: unknown, sibling: { enabled?: boolean }) => sibling.enabled === true

const terrace: GroupField = {
  name: 'terrace',
  type: 'group',
  label: label('Терраса', 'Terrace'),
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      label: label('Есть терраса', 'Has a terrace'),
      defaultValue: false,
    },
    {
      type: 'row',
      admin: { condition: enabledOnly },
      fields: [
        keyField('entrance', {
          required: false,
          label: label('Ключ входной двери', 'Entrance door key'),
          admin: {
            width: '25%',
            description: label(
              'Терраса примыкает к этой двери; ступени — у неё',
              'The terrace adjoins this door; its steps are at the door',
            ),
          },
        }),
        {
          name: 'reach',
          type: 'select',
          label: label('Направление от двери', 'Direction from the door'),
          options: registryOptions('terraceReach', TERRACE_REACHES),
          defaultValue: 'left',
          admin: { width: '25%' },
        },
        millimetres('length', label('Длина, мм', 'Length, mm'), { required: false, min: 1 }),
        millimetres('depth', label('Глубина, мм', 'Depth, mm'), { required: false, min: 1 }),
      ],
    },
  ],
}

const chimney: GroupField = {
  name: 'chimney',
  type: 'group',
  label: label('Дымоход', 'Chimney'),
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      label: label('Есть печь или камин', 'Has a stove or fireplace'),
      defaultValue: false,
    },
    {
      type: 'row',
      admin: { condition: enabledOnly },
      fields: [
        millimetres('x', label('X, мм', 'X, mm'), { required: false }),
        millimetres('y', label('Y, мм', 'Y, mm'), { required: false }),
      ],
    },
  ],
}

/** Architectural design of the project: the only source of its geometry. */
export const designField: GroupField = {
  name: 'design',
  type: 'group',
  label: label('Конструкция и планировка', 'Structure and layout'),
  fields: [
    {
      type: 'row',
      fields: [
        millimetres('width', label('Ширина по наружным стенам, мм', 'Outer width, mm'), FOOTPRINT),
        millimetres('depth', label('Глубина по наружным стенам, мм', 'Outer depth, mm'), FOOTPRINT),
        {
          name: 'storeys',
          type: 'number',
          label: label('Этажей', 'Storeys'),
          required: true,
          min: 1,
          max: MAX_STOREYS,
          defaultValue: 1,
          admin: { width: '25%' },
        },
        millimetres(
          'storeyHeight',
          label('Высота этажа в чистоте, мм', 'Clear storey height, mm'),
          STOREY_HEIGHT,
        ),
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'attic',
          type: 'checkbox',
          label: label('Мансардный этаж', 'Attic floor'),
          defaultValue: false,
          admin: { width: '50%' },
        },
        {
          name: 'ridgeAxis',
          type: 'select',
          label: label('Направление конька', 'Ridge direction'),
          required: true,
          defaultValue: 'x',
          options: registryOptions('ridgeAxis', RIDGE_AXES),
          admin: { width: '50%' },
        },
      ],
    },
    rooms,
    openings,
    doors,
    terrace,
    chimney,
  ],
}
