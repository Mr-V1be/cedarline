import type { Access, CollectionConfig } from 'payload'

import { ROLE_KEYS } from '@/modules/access/domain/roles'

import {
  canOpenAdmin,
  exceptDemoAccounts,
  requireCapability,
  requireFieldCapability,
  userCan,
} from '../access/policies'
import { label } from '../fields/labels'
import { ROLE_LABELS } from '../fields/role-labels'

/** Managers of users see everyone; everybody else sees only themselves. */
const selfOrManager: Access = ({ req }) =>
  userCan(req.user, 'users.manage') ? true : req.user ? { id: { equals: req.user.id } } : false

/** Eight-hour working session; brute force is throttled per account. */
const SESSION_SECONDS = 8 * 60 * 60
const MAX_LOGIN_ATTEMPTS = 5
const LOCK_MS = 10 * 60 * 1000

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: label('Пользователь', 'User'), plural: label('Пользователи', 'Users') },
  auth: {
    tokenExpiration: SESSION_SECONDS,
    maxLoginAttempts: MAX_LOGIN_ATTEMPTS,
    lockTime: LOCK_MS,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'roles'],
    group: label('Доступ', 'Access'),
  },
  access: {
    admin: canOpenAdmin,
    read: selfOrManager,
    create: requireCapability('users.manage'),
    update: exceptDemoAccounts(selfOrManager),
    delete: exceptDemoAccounts(requireCapability('users.manage')),
  },
  fields: [
    { name: 'name', type: 'text', label: label('Имя', 'Name'), required: true },
    {
      name: 'roles',
      type: 'select',
      label: label('Роли', 'Roles'),
      hasMany: true,
      required: true,
      saveToJWT: true,
      options: ROLE_KEYS.map((role) => ({ value: role, label: ROLE_LABELS[role] })),
      access: {
        create: requireFieldCapability('users.manage'),
        update: requireFieldCapability('users.manage'),
      },
    },
  ],
}
