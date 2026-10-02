import { existsSync } from 'node:fs'
import path from 'node:path'

import type { Payload } from 'payload'

import type { Localized } from '../data/localized'
import { SEED } from './upsert'

/** Renders of our own 3D scene, produced by `pnpm render:covers` and kept with the seed. */
export const RENDER_DIRECTORY = path.resolve(process.cwd(), 'seed-assets/renders')
const RENDER_SOURCE = 'Рендер 3D-сцены сайта / render of the site 3D scene'

export const renderFile = (name: string) => path.join(RENDER_DIRECTORY, `${name}.webp`)

/** Uploads a render once; returns its id, or null when the render has not been produced yet. */
export async function seedRender(
  payload: Payload,
  name: string,
  alt: Localized,
): Promise<number | null> {
  const filePath = renderFile(name)
  if (!existsSync(filePath)) return null
  const filename = path.basename(filePath)
  const existing = await payload.find({
    ...SEED,
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
  })
  let id = existing.docs[0]?.id
  if (id === undefined) {
    const created = await payload.create({
      ...SEED,
      collection: 'media',
      locale: 'ru',
      data: { alt: alt.ru, source: RENDER_SOURCE },
      filePath,
    })
    id = created.id
  } else {
    await payload.update({ ...SEED, collection: 'media', id, locale: 'ru', data: { alt: alt.ru } })
  }
  await payload.update({ ...SEED, collection: 'media', id, locale: 'en', data: { alt: alt.en } })
  return id
}
