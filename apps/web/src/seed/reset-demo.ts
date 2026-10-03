import type { CollectionSlug, Payload, Where } from 'payload'

import { DEMO_ACCOUNT_EMAILS } from '@/modules/demo/domain/demo-tours'
import { DELIVERY_QUEUE } from '@/modules/leads/infrastructure/payload-delivery-queue'

import { ARTICLES } from './data/articles'
import { BUILT_OBJECTS } from './data/built-objects'
import { PROJECT_TYPES, ROOM_KINDS } from './data/dictionaries'
import { seedDemoContent } from './seed-demo'
import { PROJECTS } from './steps/projects'
import { SEED } from './steps/upsert'

/** Deleted page by page, so a stand flooded with leads does not load them all at once. */
const BATCH = 200

/** What visitors produce on a demo stand: every record of these goes. */
const VISITOR_RECORDS: ReadonlyArray<{ collection: CollectionSlug; where: Where }> = [
  { collection: 'leads', where: {} },
  { collection: 'configurations', where: {} },
  { collection: 'documents', where: {} },
  { collection: 'mailbox', where: {} },
  { collection: 'mailbox-files', where: {} },
  { collection: 'rate-limit-hits', where: {} },
  // Pending lead deliveries would retry leads that no longer exist.
  { collection: 'payload-jobs', where: { queue: { equals: DELIVERY_QUEUE } } },
  { collection: 'payload-locked-documents', where: {} },
  { collection: 'payload-preferences', where: {} },
]

/**
 * Seeded collections: a document the seed does not know is a visitor's addition and goes; the
 * seed then restores every seeded one, including those a visitor deleted or changed.
 */
const VISITOR_ADDITIONS: ReadonlyArray<{ collection: CollectionSlug; where: Where }> = [
  { collection: 'articles', where: { slug: { not_in: ARTICLES.map((item) => item.slug) } } },
  {
    collection: 'built-objects',
    where: { slug: { not_in: BUILT_OBJECTS.map((item) => item.slug) } },
  },
  { collection: 'projects', where: { slug: { not_in: PROJECTS.map((item) => item.slug) } } },
  {
    collection: 'project-types',
    where: { slug: { not_in: PROJECT_TYPES.map((item) => item.slug) } },
  },
  { collection: 'room-kinds', where: { key: { not_in: ROOM_KINDS.map((item) => item.key) } } },
  { collection: 'users', where: { email: { not_in: [...DEMO_ACCOUNT_EMAILS] } } },
  // Seeded renders and schemes carry an import key; uploads through the CMS do not.
  { collection: 'media', where: { 'origin.key': { exists: false } } },
]

async function deleteAll(payload: Payload, collection: CollectionSlug, where: Where) {
  let deleted = 0
  for (;;) {
    const { docs } = await payload.find({ ...SEED, collection, where, limit: BATCH, select: {} })
    if (docs.length === 0) return deleted
    const ids = docs.map((doc) => doc.id)
    await payload.delete({ ...SEED, collection, where: { id: { in: ids } } })
    deleted += ids.length
  }
}

/**
 * The demo stand's nightly reset: whatever visitors created goes, whatever they changed or
 * removed comes back from the seed. Returns how many documents were removed per collection.
 */
export async function resetDemoData(
  payload: Payload,
  log: (message: string) => void,
): Promise<Record<string, number>> {
  const removed: Record<string, number> = {}
  for (const { collection, where } of [...VISITOR_RECORDS, ...VISITOR_ADDITIONS]) {
    removed[collection] = await deleteAll(payload, collection, where)
  }
  log(`removed ${JSON.stringify(removed)}`)
  await seedDemoContent(payload, log)
  return removed
}
