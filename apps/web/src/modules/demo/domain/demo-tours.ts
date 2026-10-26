import type { Role } from '@/modules/access/domain/roles'

/** A section of the CMS worth opening first, with the path it lives at. */
export interface DemoStop {
  readonly key: string
  readonly path: string
}

/**
 * A demo account and what to look at with it. The first stop is where the sign-in lands; any
 * other stop can be the landing too, so the demo page links straight into a section.
 */
export interface DemoTour {
  readonly role: Role
  readonly email: string
  readonly stops: readonly [DemoStop, ...DemoStop[]]
}

/** One demo account per role, in the order the demo page shows them. */
export const DEMO_TOURS = [
  {
    role: 'sales-manager',
    email: 'sales@cedarline.example',
    stops: [
      { key: 'leads', path: '/admin/collections/leads' },
      { key: 'mailbox', path: '/admin/collections/mailbox' },
      { key: 'configurations', path: '/admin/collections/configurations' },
    ],
  },
  {
    role: 'content-manager',
    email: 'content@cedarline.example',
    stops: [
      { key: 'projects', path: '/admin/collections/projects' },
      { key: 'rules', path: '/admin/globals/catalog-options' },
      { key: 'tariff', path: '/admin/globals/tariff' },
      { key: 'articles', path: '/admin/collections/articles' },
    ],
  },
  {
    role: 'admin',
    email: 'admin@cedarline.example',
    stops: [
      { key: 'dashboard', path: '/admin' },
      { key: 'users', path: '/admin/collections/users' },
      { key: 'company', path: '/admin/globals/site' },
    ],
  },
] as const satisfies readonly DemoTour[]

export type DemoRole = (typeof DEMO_TOURS)[number]['role']
export type DemoStopKey = (typeof DEMO_TOURS)[number]['stops'][number]['key']

/** Addresses of the demo accounts: the accounts a demo stand protects from changes. */
export const DEMO_ACCOUNT_EMAILS: readonly string[] = DEMO_TOURS.map((tour) => tour.email)

export function demoTourOf(role: string): DemoTour | null {
  return DEMO_TOURS.find((tour) => tour.role === role) ?? null
}

/**
 * Where a sign-in as this tour's account lands: the requested stop when it belongs to the
 * tour, otherwise the first one. Only paths of the registry are ever returned.
 */
export function landingOf(tour: DemoTour, stopKey: string | null): string {
  const stop = tour.stops.find((candidate) => candidate.key === stopKey) ?? tour.stops[0]
  return stop.path
}
