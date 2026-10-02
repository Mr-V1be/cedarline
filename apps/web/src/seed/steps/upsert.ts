import type { CollectionSlug, Payload, Where } from 'payload'

/** Seed context: no access checks, every operation keyed by a natural unique key. */
export const SEED = { overrideAccess: true, depth: 0 } as const

/**
 * Creates or updates the single document matching a unique key, so the seed can run any
 * number of times and converges to the same content.
 */
export async function upsert(
  payload: Payload,
  collection: CollectionSlug,
  where: Where,
  data: Record<string, unknown>,
): Promise<number> {
  const existing = await payload.find({ ...SEED, collection, where, limit: 1, locale: 'ru' })
  const document = existing.docs[0] as { id: number } | undefined
  if (document !== undefined) {
    await payload.update({
      ...SEED,
      collection,
      id: document.id,
      data: data,
      locale: 'ru',
    })
    return document.id
  }
  const created = (await payload.create({
    ...SEED,
    collection,
    data: data as never,
    locale: 'ru',
  })) as { id: number }
  return created.id
}

/** Writes the English values of localized fields after the Russian ones exist. */
export async function translate(
  payload: Payload,
  collection: CollectionSlug,
  id: number,
  data: Record<string, unknown>,
) {
  await payload.update({ ...SEED, collection, id, data: data, locale: 'en' })
}

/**
 * English names for rows of an array whose subfield is localized: the rows must keep their
 * ids, otherwise Payload would replace them and drop the Russian values.
 */
export function englishRows<Row extends { id?: string | null }>(
  rows: readonly Row[] | null | undefined,
  english: (row: Row, index: number) => Partial<Row>,
): Row[] {
  return (rows ?? []).map((row, index) => ({ ...row, ...english(row, index) }))
}
