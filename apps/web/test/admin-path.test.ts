import { describe, expect, it } from 'vitest'

import { adminEntityOf } from '@/cms/admin/admin-path'
import { declareReadCapability, readCapabilityOf } from '@/cms/access/policies'

describe('admin access-denied page', () => {
  it.each([
    ['/admin/collections/leads', { kind: 'collection', slug: 'leads' }],
    ['/admin/collections/leads/12', { kind: 'collection', slug: 'leads' }],
    ['/admin/globals/tariff', { kind: 'global', slug: 'tariff' }],
    ['/admin', null],
    ['/admin/account', null],
    [null, null],
  ])('reads the section of %s', (path, entity) => {
    expect(adminEntityOf(path)).toEqual(entity)
  })

  it('round-trips the declared read capability and ignores anything else', () => {
    expect(readCapabilityOf(declareReadCapability('leads.read'))).toBe('leads.read')
    expect(readCapabilityOf({ readCapability: 'everything' })).toBeNull()
    expect(readCapabilityOf(undefined)).toBeNull()
  })
})
