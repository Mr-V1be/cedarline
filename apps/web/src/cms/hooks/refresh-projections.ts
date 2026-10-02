import type { PayloadRequest } from 'payload'

import { DEFAULT_LOCALE } from '@/i18n/locales'

/** Projects re-priced per page of the refresh; keeps memory flat for any catalog size. */
const BATCH_SIZE = 50

/**
 * Re-saves every project inside the current transaction so that its projection hook measures
 * and prices it against the data that has just changed.
 */
export async function reprojectAllProjects(parent: PayloadRequest): Promise<void> {
  // A copy keeps the parent's transaction but not its locale: projections are not localized,
  // and saving in the primary locale validates against content that always exists.
  const req = { ...parent, locale: DEFAULT_LOCALE } as PayloadRequest
  for (let page = 1; ; page += 1) {
    const batch = await req.payload.find({
      collection: 'projects',
      req,
      page,
      limit: BATCH_SIZE,
      depth: 0,
      sort: 'id',
      overrideAccess: true,
      select: {},
    })
    for (const project of batch.docs) {
      await req.payload.update({
        collection: 'projects',
        id: project.id,
        data: {},
        req,
        locale: DEFAULT_LOCALE,
        depth: 0,
        overrideAccess: true,
      })
    }
    if (!batch.hasNextPage) return
  }
}

/**
 * afterChange hook for data the catalog projection depends on. `relevant` extracts what the
 * projection reads; edits elsewhere (names, translations) do not re-price the catalog.
 */
export function refreshProjectionsOnChange<T>(relevant: (document: T) => unknown) {
  return async ({
    doc,
    previousDoc,
    req,
  }: {
    doc: T
    previousDoc?: T | null
    req: PayloadRequest
  }): Promise<T> => {
    const before =
      previousDoc === undefined || previousDoc === null
        ? null
        : JSON.stringify(relevant(previousDoc))
    if (before !== JSON.stringify(relevant(doc))) await reprojectAllProjects(req)
    return doc
  }
}
