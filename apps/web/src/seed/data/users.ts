import type { Role } from '@/modules/access/domain/roles'

/**
 * Demo accounts for the CMS, one per role. They exist only in demo databases and are listed
 * in the README so that the roles can be tried out.
 */
export const DEMO_USERS: ReadonlyArray<{
  email: string
  password: string
  name: string
  roles: Role[]
}> = [
  {
    email: 'admin@kedrovnik.example',
    password: 'kedrovnik-admin-demo',
    name: 'Администратор',
    roles: ['admin'],
  },
  {
    email: 'content@kedrovnik.example',
    password: 'kedrovnik-content-demo',
    name: 'Контент-менеджер',
    roles: ['content-manager'],
  },
  {
    email: 'sales@kedrovnik.example',
    password: 'kedrovnik-sales-demo',
    name: 'Менеджер продаж',
    roles: ['sales-manager'],
  },
]
