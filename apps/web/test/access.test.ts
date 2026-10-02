import { describe, expect, it } from 'vitest'

import {
  CAPABILITIES,
  ROLE_KEYS,
  rolesGrant,
  type Capability,
  type Role,
} from '@/modules/access/domain/roles'

/** The access contract: who may do what. A change here is a product decision, not a refactor. */
const EXPECTED: Record<Role, readonly Capability[]> = {
  admin: CAPABILITIES,
  'content-manager': ['catalog.write', 'pricing.write', 'content.write'],
  'sales-manager': ['leads.read', 'leads.write'],
}

describe('role capabilities', () => {
  it.each(ROLE_KEYS)('%s has exactly its capabilities', (role) => {
    for (const capability of CAPABILITIES) {
      expect(rolesGrant([role], capability)).toBe(EXPECTED[role].includes(capability))
    }
  })

  it('grants nothing to visitors and unknown roles', () => {
    for (const capability of CAPABILITIES) {
      expect(rolesGrant([], capability)).toBe(false)
      expect(rolesGrant(['superuser'], capability)).toBe(false)
    }
  })

  it('combines several roles', () => {
    expect(rolesGrant(['sales-manager', 'content-manager'], 'catalog.write')).toBe(true)
    expect(rolesGrant(['sales-manager', 'content-manager'], 'users.manage')).toBe(false)
  })
})
