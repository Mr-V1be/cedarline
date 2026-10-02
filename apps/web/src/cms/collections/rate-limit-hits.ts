import type { CollectionConfig } from 'payload'

/**
 * Request counters of the anti-spam rate limiter, one row per counted request. The key is a
 * keyed hash of the client address, never the address itself. Not visible in the admin panel.
 */
export const RateLimitHits: CollectionConfig = {
  slug: 'rate-limit-hits',
  admin: { hidden: true },
  access: { read: () => false, create: () => false, update: () => false, delete: () => false },
  fields: [
    { name: 'bucket', type: 'text', required: true, index: true },
    { name: 'key', type: 'text', required: true, index: true },
  ],
}
