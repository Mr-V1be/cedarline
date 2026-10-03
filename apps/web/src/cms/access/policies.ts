import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

import { CAPABILITIES, rolesGrant, type Capability } from '@/modules/access/domain/roles'
import { DEMO_ACCOUNT_EMAILS } from '@/modules/demo/domain/demo-tours'

/** Roles of the signed-in CMS user; anonymous visitors have none. */
export function rolesOf(user: PayloadRequest['user']): readonly string[] {
  if (user === null || !('roles' in user)) return []
  const { roles } = user as { roles?: unknown }
  return Array.isArray(roles)
    ? roles.filter((role): role is string => typeof role === 'string')
    : []
}

export const userCan = (user: PayloadRequest['user'], capability: Capability): boolean =>
  rolesGrant(rolesOf(user), capability)

export const anyone: Access = () => true

export const requireCapability =
  (capability: Capability): Access =>
  ({ req }) =>
    userCan(req.user, capability)

export const requireFieldCapability =
  (capability: Capability): FieldAccess =>
  ({ req }) =>
    userCan(req.user, capability)

const PUBLISHED: Where = { status: { equals: 'published' } }

/** Visitors see published documents; editors with the capability also see drafts. */
export const publishedOr =
  (capability: Capability): Access =>
  ({ req }) =>
    userCan(req.user, capability) ? true : PUBLISHED

/** Any user with at least one known role may open the admin panel. */
export const canOpenAdmin = ({ req }: { req: PayloadRequest }): boolean =>
  rolesOf(req.user).length > 0

/**
 * Capability needed to open a collection or global in the CMS, kept in its `custom` settings so
 * the access-denied page can name the roles that have it.
 */
export const READ_CAPABILITY = 'readCapability'

export const readCapabilityOf = (
  custom: Record<string, unknown> | undefined,
): Capability | null => {
  const value = custom?.[READ_CAPABILITY]
  return typeof value === 'string' && (CAPABILITIES as readonly string[]).includes(value)
    ? (value as Capability)
    : null
}

/** `custom` settings of a collection that is read with a capability (see `readCapabilityOf`). */
export const declareReadCapability = (capability: Capability) => ({ [READ_CAPABILITY]: capability })

/**
 * On a demo stand the demo accounts are shared by every visitor: nobody may change or delete
 * them, or the next visitor would find a role locked out. Elsewhere the access is unchanged.
 * `demoStand` tells which of the two this deployment is.
 */
export const exceptDemoAccounts =
  (access: Access, demoStand: () => boolean): Access =>
  async (args) => {
    const granted = await access(args)
    if (!demoStand() || granted === false) return granted
    const others: Where = { email: { not_in: DEMO_ACCOUNT_EMAILS } }
    return granted === true ? others : { and: [granted, others] }
  }
