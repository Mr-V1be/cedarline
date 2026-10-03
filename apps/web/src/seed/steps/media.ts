import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import type { Payload } from 'payload'

import type { Localized } from '../data/localized'
import { SEED } from './upsert'

/** Renders of our own 3D scene, produced by `pnpm render:covers` and kept with the seed. */
export const RENDER_DIRECTORY = path.resolve(process.cwd(), 'seed-assets/renders')
const RENDER_SOURCE = 'Рендер 3D-сцены сайта / render of the site 3D scene'

export const renderFile = (name: string) => path.join(RENDER_DIRECTORY, `${name}.webp`)

/**
 * Whether a seeded media document still holds the seed's file: stored under the asset's name
 * and present on disk. A file replaced in the CMS (the demo stand lets visitors do it) gets
 * the uploaded file's name, so the seed puts its own file back.
 */
export function holdsSeedFile(
  payload: Payload,
  filename: string | null | undefined,
  name: string,
): boolean {
  if (typeof filename !== 'string' || !filename.startsWith(name)) return false
  const { staticDir = '' } = payload.collections.media.config.upload
  return existsSync(path.resolve(process.cwd(), staticDir, filename))
}

/**
 * Uploads a render and returns its id, or null when the render has not been produced yet.
 * Renders are found by their import key; a re-produced render (another checksum) replaces the
 * file of the same media document, so every page that shows it keeps its link.
 */
export async function seedRender(
  payload: Payload,
  name: string,
  alt: Localized,
): Promise<number | null> {
  const source = renderFile(name)
  if (!existsSync(source)) return null
  const key = `render:${name}`
  const checksum = createHash('sha256').update(readFileSync(source)).digest('hex')
  const existing = await payload.find({
    ...SEED,
    collection: 'media',
    where: { 'origin.key': { equals: key } },
    limit: 1,
  })
  const stored = existing.docs[0]
  const origin = { key, checksum }
  let id: number
  if (stored === undefined) {
    const created = await payload.create({
      ...SEED,
      collection: 'media',
      locale: 'ru',
      data: { alt: alt.ru, source: RENDER_SOURCE, origin },
      filePath: source,
    })
    id = created.id
  } else {
    id = stored.id
    const changed =
      stored.origin?.checksum !== checksum || !holdsSeedFile(payload, stored.filename, name)
    await withVersionedName(source, checksum, changed, (filePath) =>
      payload.update({
        ...SEED,
        collection: 'media',
        id,
        locale: 'ru',
        data: { alt: alt.ru, origin },
        ...(filePath === undefined ? {} : { filePath }),
      }),
    )
  }
  await payload.update({ ...SEED, collection: 'media', id, locale: 'en', data: { alt: alt.en } })
  return id
}

/**
 * Runs `upload` with a copy of the source named after its checksum when the file changed: the
 * stored file gets a fresh name instead of colliding with the one it replaces.
 */
async function withVersionedName<T>(
  source: string,
  checksum: string,
  changed: boolean,
  upload: (filePath: string | undefined) => Promise<T>,
): Promise<T> {
  if (!changed) return upload(undefined)
  const directory = mkdtempSync(path.join(tmpdir(), 'kedrovnik-render-'))
  const versioned = path.join(
    directory,
    `${path.basename(source, '.webp')}-${checksum.slice(0, 8)}.webp`,
  )
  copyFileSync(source, versioned)
  try {
    return await upload(versioned)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}
