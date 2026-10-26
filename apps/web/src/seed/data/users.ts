import type { Role } from '@/modules/access/domain/roles'
import { demoTourOf, type DemoRole } from '@/modules/demo/domain/demo-tours'

/** Passwords of the demo accounts, for signing in with the form; listed in the README. */
const PASSWORDS: Readonly<Record<DemoRole, string>> = {
  admin: 'cedarline-admin-demo',
  'content-manager': 'cedarline-content-demo',
  'sales-manager': 'cedarline-sales-demo',
}

const NAMES: Readonly<Record<DemoRole, string>> = {
  admin: 'Администратор',
  'content-manager': 'Контент-менеджер',
  'sales-manager': 'Менеджер продаж',
}

const account = (role: DemoRole) => {
  const tour = demoTourOf(role)
  if (tour === null) throw new Error(`No demo tour for ${role}`)
  return {
    email: tour.email,
    password: PASSWORDS[role],
    name: NAMES[role],
    roles: [role] as Role[],
  }
}

/**
 * Demo accounts for the CMS, one per role; their addresses come from the demo tours, which the
 * one-click sign-in and the demo-stand protection use too. They exist only in demo databases.
 */
export const DEMO_USERS: ReadonlyArray<{
  email: string
  password: string
  name: string
  roles: Role[]
}> = (['admin', 'content-manager', 'sales-manager'] as const).map(account)
