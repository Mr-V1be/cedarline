/**
 * Capability-based access. Roles are bundles of capabilities; checks always ask for a
 * capability, never for a role, so adding a role is adding an entry here.
 */
export const CAPABILITIES = [
  'catalog.write',
  'pricing.write',
  'content.write',
  'leads.read',
  'leads.write',
  'users.manage',
] as const
export type Capability = (typeof CAPABILITIES)[number]

export interface RoleDefinition {
  readonly capabilities: readonly Capability[]
}

export const ROLES = {
  admin: { capabilities: CAPABILITIES },
  'content-manager': { capabilities: ['catalog.write', 'pricing.write', 'content.write'] },
  'sales-manager': { capabilities: ['leads.read', 'leads.write'] },
} as const satisfies Record<string, RoleDefinition>

export type Role = keyof typeof ROLES
export const ROLE_KEYS = Object.keys(ROLES) as Role[]

export const isRole = (value: string): value is Role => value in ROLES

/** True when any of the given roles grants the capability; unknown roles grant nothing. */
export function rolesGrant(roles: readonly string[], capability: Capability): boolean {
  return roles.some(
    (role) =>
      isRole(role) && (ROLES[role].capabilities as readonly Capability[]).includes(capability),
  )
}
