import type { Role } from '@/modules/access/domain/roles'

import { label, type Labels } from './labels'

export const ROLE_LABELS: Readonly<Record<Role, Labels>> = {
  admin: label('Администратор', 'Administrator'),
  'content-manager': label('Контент-менеджер', 'Content manager'),
  'sales-manager': label('Менеджер продаж', 'Sales manager'),
}
