import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

import { rolesGrant, type Capability } from '@/modules/access/domain/roles'

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
